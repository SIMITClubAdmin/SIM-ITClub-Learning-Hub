"use client";

import type { FileSystemTree, WebContainer, WebContainerProcess } from "@webcontainer/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createMiniGit, type Files, type RepoState, type RepoStatus } from "./engine/mini-git";
import { buildGitCli, DEV_PORT, IGNORED_DIRS, STARTER_FILES } from "./engine/sandbox-files";

/** One engine for the whole page: the browser uses it for status and the fallback shell. */
export const gitEngine = createMiniGit();

export type StudioMode = "booting" | "container" | "fallback";
export type Speed = 1 | 0.5;
export type PushEvent = { id: number; branch: string; commits: string[]; prevRemote: Record<string, string> };
/** What the terminal pane lets the rest of the studio do to it. */
export type TerminalApi = { type(command: string): void; note(text: string): void };

type StudioContextValue = {
  mode: StudioMode;
  bootMessage: string;
  fallbackReason: string | null;
  wc: WebContainer | null;
  bootId: number;
  files: Files;
  repo: RepoState;
  status: RepoStatus;
  pushEvent: PushEvent | null;
  finishPush: (id: number) => void;
  serverUrl: string | null;
  devLog: string;
  devRunning: boolean;
  previewNonce: number;
  commitMessage: string;
  setCommitMessage: (message: string) => void;
  speed: Speed;
  setSpeed: (speed: Speed) => void;
  updateFile: (path: string, content: string) => void;
  flushWrites: () => Promise<void>;
  syncFromSandbox: () => Promise<void>;
  runCommand: (command: string) => Promise<void>;
  registerTerminal: (api: TerminalApi) => () => void;
  startDevServer: () => Promise<void>;
  reloadPreview: () => void;
  runFallback: (line: string) => string;
  reset: () => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) throw new Error("useStudio must be used inside <WebContainerProvider>");
  return value;
}

type BootGlobal = typeof globalThis & { __gitStudioBoot?: Promise<WebContainer> | null };

const ANSI = /\x1b\[[0-9;?]*[A-Za-z]|\x1b\][^\x07]*\x07/g;
const stripAnsi = (text: string) => text.replace(ANSI, "");

function freshRepo() {
  return gitEngine.initialState(STARTER_FILES, Date.now());
}

function sameFiles(a: Files, b: Files) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if (a[key] !== b[key]) return false;
  return true;
}

/** Commits GitHub did not have before, for every remote branch that moved. */
function detectPush(prev: RepoState, next: RepoState) {
  const had = new Set<string>();
  for (const tip of Object.values(prev.remote)) for (const id of gitEngine.reachable(next, tip)) had.add(id);
  const sent = new Set<string>();
  let branch = "";
  for (const [name, tip] of Object.entries(next.remote)) {
    if (prev.remote[name] === tip) continue;
    for (const id of gitEngine.reachable(next, tip)) {
      if (!had.has(id)) {
        sent.add(id);
        branch = name;
      }
    }
  }
  return { branch, commits: next.order.filter((id) => sent.has(id)) };
}

function buildTree(files: Files, state: RepoState): FileSystemTree {
  const tree: FileSystemTree = {};
  for (const [path, contents] of Object.entries(files)) {
    const parts = path.split("/");
    let dir = tree;
    for (const part of parts.slice(0, -1)) {
      const node = (dir[part] ??= { directory: {} });
      dir = "directory" in node ? node.directory : {};
    }
    dir[parts[parts.length - 1]] = { file: { contents } };
  }
  tree[".git"] = { directory: { "studio.json": { file: { contents: JSON.stringify(state) } } } };
  tree[".studio"] = {
    directory: { bin: { directory: { git: { file: { contents: buildGitCli(createMiniGit.toString()) } } } } },
  };
  return tree;
}

async function readSandboxFiles(box: WebContainer) {
  const out: Files = {};
  async function walk(dir: string, prefix: string) {
    const entries = await box.fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORED_DIRS.includes(entry.name)) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(rel, rel);
      else if (entry.isFile()) out[rel] = await box.fs.readFile(rel, "utf-8");
    }
  }
  await walk(".", "");
  return out;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const FALLBACK_HELP = [
  "This lightweight shell understands:",
  "  git <command>    the full studio Git (try: git help)",
  "  ls, cat <file>, pwd, echo, clear",
  "  npm install, npm run dev",
].join("\n");

export function WebContainerProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<StudioMode>("booting");
  const [bootMessage, setBootMessage] = useState("Booting WebContainer…");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [wc, setWc] = useState<WebContainer | null>(null);
  const [bootId, setBootId] = useState(0);
  const [files, setFilesState] = useState<Files>(() => ({ ...STARTER_FILES }));
  const [repo, setRepoState] = useState<RepoState>(freshRepo);
  const [pushEvent, setPushEvent] = useState<PushEvent | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [devLog, setDevLog] = useState("");
  const [devRunning, setDevRunning] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [commitMessage, setCommitMessage] = useState("feat: update portal UI");
  const [speed, setSpeed] = useState<Speed>(1);

  const filesRef = useRef(files);
  const repoRef = useRef(repo);
  const modeRef = useRef<StudioMode>("booting");
  const wcRef = useRef<WebContainer | null>(null);
  const terminalRef = useRef<TerminalApi | null>(null);
  /** Editor changes not yet written into the sandbox: a pending timer, or null while writing. */
  const pendingRef = useRef(new Map<string, ReturnType<typeof setTimeout> | null>());
  const devProcRef = useRef<WebContainerProcess | null>(null);
  const pushCounter = useRef(0);
  const syncChain = useRef<Promise<void>>(Promise.resolve());
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFiles = useCallback((next: Files) => {
    filesRef.current = next;
    setFilesState(next);
  }, []);

  const setRepo = useCallback((next: RepoState) => {
    repoRef.current = next;
    setRepoState(next);
  }, []);

  const applyRepo = useCallback(
    (next: RepoState) => {
      const prev = repoRef.current;
      if (JSON.stringify(prev) === JSON.stringify(next)) return;
      setRepo(next);
      const push = detectPush(prev, next);
      if (push.commits.length) {
        pushCounter.current += 1;
        setPushEvent({ id: pushCounter.current, branch: push.branch, commits: push.commits, prevRemote: prev.remote });
      }
    },
    [setRepo],
  );

  const reloadPreview = useCallback(() => setPreviewNonce((n) => n + 1), []);

  const schedulePreviewReload = useCallback(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(reloadPreview, 600);
  }, [reloadPreview]);

  const writeNow = useCallback(
    async (path: string) => {
      const pending = pendingRef.current;
      const timer = pending.get(path);
      if (timer) clearTimeout(timer);
      pending.set(path, null);
      const box = wcRef.current;
      const content = filesRef.current[path];
      try {
        if (box && content !== undefined) await box.fs.writeFile(path, content);
      } finally {
        if (pending.get(path) === null) pending.delete(path);
      }
      schedulePreviewReload();
    },
    [schedulePreviewReload],
  );

  const flushWrites = useCallback(async () => {
    const paths = Array.from(pendingRef.current.entries())
      .filter(([, timer]) => timer !== null)
      .map(([path]) => path);
    await Promise.all(paths.map(writeNow));
  }, [writeNow]);

  const updateFile = useCallback(
    (path: string, content: string) => {
      setFiles({ ...filesRef.current, [path]: content });
      if (modeRef.current !== "container") {
        schedulePreviewReload();
        return;
      }
      const pending = pendingRef.current;
      const timer = pending.get(path);
      if (timer) clearTimeout(timer);
      pending.set(
        path,
        setTimeout(() => void writeNow(path), 300),
      );
    },
    [setFiles, schedulePreviewReload, writeNow],
  );

  const syncFromSandbox = useCallback(() => {
    syncChain.current = syncChain.current.then(async () => {
      const box = wcRef.current;
      if (!box) return;
      try {
        const [stateText, disk] = await Promise.all([box.fs.readFile(".git/studio.json", "utf-8"), readSandboxFiles(box)]);
        if (box !== wcRef.current) return;
        applyRepo(JSON.parse(stateText) as RepoState);
        // Keep anything the student typed that has not reached the sandbox yet.
        const current = filesRef.current;
        const next: Files = {};
        for (const [path, content] of Object.entries(disk)) {
          next[path] = pendingRef.current.has(path) && path in current ? current[path] : content;
        }
        for (const path of pendingRef.current.keys()) if (!(path in next) && path in current) next[path] = current[path];
        if (!sameFiles(next, current)) {
          setFiles(next);
          schedulePreviewReload();
        }
      } catch {
        // The sandbox may be rebooting; the next command syncs again.
      }
    });
    return syncChain.current;
  }, [applyRepo, setFiles, schedulePreviewReload]);

  const registerTerminal = useCallback((api: TerminalApi) => {
    terminalRef.current = api;
    return () => {
      if (terminalRef.current === api) terminalRef.current = null;
    };
  }, []);

  const runCommand = useCallback(
    async (command: string) => {
      await flushWrites();
      terminalRef.current?.type(command);
    },
    [flushWrites],
  );

  const startDevServer = useCallback(async () => {
    await flushWrites();
    if (modeRef.current === "fallback") {
      setServerUrl("fallback");
      setDevRunning(true);
      setDevLog(`> itclub-portal@1.0.0 dev\n> node server.js\n\n  ITClub portal dev server ready (built-in preview)\n  ➜  Local:   http://localhost:${DEV_PORT}/\n`);
      terminalRef.current?.note("\x1b[2m[background] npm run dev started. Watch it in the Live Preview drawer.\x1b[0m");
      return;
    }
    const box = wcRef.current;
    if (!box) return;
    if (devProcRef.current) {
      terminalRef.current?.note("\x1b[2m[background] The dev server is already running.\x1b[0m");
      return;
    }
    setDevLog("");
    setDevRunning(true);
    terminalRef.current?.note("\x1b[2m[background] npm run dev started. Watch it in the Live Preview drawer.\x1b[0m");
    const proc = await box.spawn("npm", ["run", "dev"]);
    devProcRef.current = proc;
    proc.output
      .pipeTo(
        new WritableStream({
          write(chunk) {
            setDevLog((log) => (log + stripAnsi(chunk)).slice(-4000));
          },
        }),
      )
      .catch(() => {});
    const stopped = () => {
      if (devProcRef.current === proc) {
        devProcRef.current = null;
        setDevRunning(false);
      }
    };
    // A reset aborts the process, which rejects instead of resolving.
    proc.exit.then(stopped, stopped);
  }, [flushWrites]);

  const runFallback = useCallback(
    (line: string) => {
      const args = gitEngine.splitArgs(line);
      const [command, ...rest] = args;
      const work = filesRef.current;
      switch (command) {
        case undefined:
          return "";
        case "git": {
          const draft: Files = { ...work };
          const result = gitEngine.run(rest, repoRef.current, {
            list: () => Object.keys(draft),
            read: (path) => draft[path] ?? null,
            write: (path, content) => {
              draft[path] = content;
            },
            remove: (path) => {
              delete draft[path];
            },
            now: () => Date.now(),
          });
          if (result.changed) applyRepo(result.state);
          if (!sameFiles(draft, work)) {
            setFiles(draft);
            schedulePreviewReload();
          }
          return result.out;
        }
        case "ls": {
          const all = rest.includes("-a") || rest.includes("-la") || rest.includes("-al");
          const names = Object.keys(work).sort();
          return `${(all ? [".git", ".studio", ...names] : names).join("  ")}\n`;
        }
        case "cat":
          return rest.map((path) => (path in work ? work[path] : `cat: ${path}: No such file or directory\n`)).join("");
        case "pwd":
          return "/home/portal\n";
        case "echo":
          return `${rest.join(" ")}\n`;
        case "help":
          return `${FALLBACK_HELP}\n`;
        case "node":
          return rest[0] === "-v" || rest[0] === "--version" ? "v20.11.1\n" : "node: only `node -v` works in the lightweight shell\n";
        case "npm":
          if (rest[0] === "install" || rest[0] === "i") return "\nup to date, audited 1 package in 214ms\n\nfound 0 vulnerabilities\n";
          if ((rest[0] === "run" && (rest[1] === "dev" || rest[1] === "start")) || rest[0] === "start") {
            void startDevServer();
            return "";
          }
          return "npm: try `npm install` or `npm run dev`\n";
        default:
          return `${command}: command not found\n${FALLBACK_HELP}\n`;
      }
    },
    [applyRepo, setFiles, schedulePreviewReload, startDevServer],
  );

  const finishPush = useCallback((id: number) => {
    setPushEvent((event) => (event?.id === id ? null : event));
  }, []);

  const reset = useCallback(() => {
    for (const timer of pendingRef.current.values()) if (timer) clearTimeout(timer);
    pendingRef.current.clear();
    try {
      devProcRef.current?.kill();
    } catch {
      // Already stopped.
    }
    devProcRef.current = null;
    const box = wcRef.current;
    wcRef.current = null;
    if (box) {
      try {
        box.teardown();
      } catch {
        // Already gone.
      }
      (globalThis as BootGlobal).__gitStudioBoot = null;
    }
    setFiles({ ...STARTER_FILES });
    setRepo(freshRepo());
    setPushEvent(null);
    setServerUrl(null);
    setDevLog("");
    setDevRunning(false);
    setWc(null);
    if (modeRef.current === "container") {
      modeRef.current = "booting";
      setMode("booting");
      setBootMessage("Rebooting the sandbox…");
    }
    setBootId((n) => n + 1);
  }, [setFiles, setRepo]);

  // Boot (or reboot) the WebContainer, or fall back to the in-browser engine.
  useEffect(() => {
    let cancelled = false;
    const unsubscribe: (() => void)[] = [];
    let watcher: { close(): void } | null = null;
    let watchTimer: ReturnType<typeof setTimeout> | null = null;
    const g = globalThis as BootGlobal;

    const fallBack = (reason: string) => {
      if (cancelled) return;
      modeRef.current = "fallback";
      setFallbackReason(reason);
      setMode("fallback");
    };

    async function boot() {
      await Promise.resolve();
      // ?engine=builtin skips the WebContainer download, for slow networks or old machines.
      if (new URLSearchParams(window.location.search).get("engine") === "builtin") {
        fallBack("Running the built-in Git engine (?engine=builtin in the URL). Remove it to boot the full WebContainer sandbox.");
        return;
      }
      if (!window.crossOriginIsolated) {
        fallBack("This tab is not cross-origin isolated, so the browser blocks WebContainers. The built-in Git engine is running instead.");
        return;
      }
      try {
        const { WebContainer } = await import("@webcontainer/api");
        g.__gitStudioBoot ??= WebContainer.boot({ workdirName: "portal" });
        const box = await withTimeout(g.__gitStudioBoot, 45_000, "Booting WebContainer");
        if (cancelled) return;
        setBootMessage("Mounting the portal project…");
        await box.mount(buildTree(filesRef.current, repoRef.current));
        try {
          const chmod = await box.spawn("chmod", ["+x", ".studio/bin/git"]);
          await chmod.exit;
        } catch {
          // jsh runs node scripts without the bit too.
        }
        if (cancelled) return;
        unsubscribe.push(box.on("server-ready", (_port, url) => setServerUrl(url)));
        unsubscribe.push(
          box.on("port", (_port, type) => {
            if (type === "close") setServerUrl(null);
          }),
        );
        try {
          // Picks up edits made from the shell (echo, touch, rm) so the editor and pipeline stay true.
          watcher = box.fs.watch(".", { recursive: true }, (_event, name) => {
            if (/(^|\/)(node_modules|\.studio|\.git)(\/|$)/.test(String(name))) return;
            if (watchTimer) clearTimeout(watchTimer);
            watchTimer = setTimeout(() => void syncFromSandbox(), 250);
          });
        } catch {
          watcher = null;
        }
        wcRef.current = box;
        modeRef.current = "container";
        setWc(box);
        setMode("container");
      } catch (error) {
        g.__gitStudioBoot = null;
        fallBack(`WebContainer could not start (${error instanceof Error ? error.message : String(error)}). The built-in Git engine is running instead.`);
      }
    }

    void boot();
    return () => {
      cancelled = true;
      unsubscribe.forEach((off) => off());
      watcher?.close();
      if (watchTimer) clearTimeout(watchTimer);
    };
  }, [bootId, syncFromSandbox]);

  useEffect(
    () => () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    },
    [],
  );

  const status = useMemo(() => gitEngine.status(repo, files), [repo, files]);

  const value = useMemo<StudioContextValue>(
    () => ({
      mode,
      bootMessage,
      fallbackReason,
      wc,
      bootId,
      files,
      repo,
      status,
      pushEvent,
      finishPush,
      serverUrl,
      devLog,
      devRunning,
      previewNonce,
      commitMessage,
      setCommitMessage,
      speed,
      setSpeed,
      updateFile,
      flushWrites,
      syncFromSandbox,
      runCommand,
      registerTerminal,
      startDevServer,
      reloadPreview,
      runFallback,
      reset,
    }),
    [
      mode,
      bootMessage,
      fallbackReason,
      wc,
      bootId,
      files,
      repo,
      status,
      pushEvent,
      finishPush,
      serverUrl,
      devLog,
      devRunning,
      previewNonce,
      commitMessage,
      speed,
      updateFile,
      flushWrites,
      syncFromSandbox,
      runCommand,
      registerTerminal,
      startDevServer,
      reloadPreview,
      runFallback,
      reset,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

/** Commit message safe to drop inside double quotes in jsh. */
export function quoteMessage(message: string) {
  const clean = message.replace(/["\\$`!]/g, "").trim() || "update";
  return `"${clean}"`;
}
