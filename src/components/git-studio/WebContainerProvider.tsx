"use client";

import type { FileSystemTree, WebContainer, WebContainerProcess } from "@webcontainer/api";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildGitCli } from "./engine/git-cli";
import { createMiniGit, type Files, type RepoState, type RepoStatus } from "./engine/mini-git";
import { DEV_PORT, IGNORED_DIRS } from "./engine/sandbox-files";
import { buildWorkspace, resolveClone, type StudioVariant, type Workspace } from "./engine/workspaces";
import { MemBox, runFallbackLine, type Box } from "./fallback-shell";

/** One engine for the whole page: the browser uses it for status, the graph and the fallback shell. */
export const gitEngine = createMiniGit();

export type StudioMode = "booting" | "container" | "fallback";
export type Speed = 1 | 0.5;
/** A push (commits travel down to GitHub) or a fetch/pull (they travel up to your machine). */
export type PushEvent = { id: number; direction: "down" | "up"; branch: string; commits: string[]; prev: RepoState };
/** What the terminal pane lets the rest of the studio do to it. */
export type TerminalApi = { type(command: string): void; note(text: string): void; interrupt(): void };
export type CommandEvent = { cmd: string; args: string[]; code: number; root: string | null; at: number };

const WORKDIR_NAME = "itcamp";
const MAX_FILES = 120;
const MAX_FILE_BYTES = 200_000;

type StudioContextValue = {
  variant: StudioVariant;
  workspace: Workspace;
  mode: StudioMode;
  bootMessage: string;
  fallbackReason: string | null;
  wc: WebContainer | null;
  session: number;
  cwd: string;
  repoRoot: string | null;
  folder: string;
  repo: RepoState | null;
  files: Files;
  dirs: string[];
  status: RepoStatus | null;
  commands: CommandEvent[];
  /** First time each milestone was seen ("repo:my-project", "branchcommit:game"...), for checklists. */
  facts: ReadonlyMap<string, number>;
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
  updateFile: (name: string, content: string) => void;
  createFile: (name: string) => Promise<string | null>;
  /** Writes a file now (Ctrl+S or the Save button); edits also save themselves shortly after typing. */
  saveFile: (name: string) => Promise<void>;
  flushWrites: () => Promise<void>;
  refresh: () => Promise<void>;
  runCommand: (command: string) => Promise<void>;
  registerTerminal: (api: TerminalApi) => () => void;
  startDevServer: () => Promise<void>;
  stopDevServer: () => void;
  reloadPreview: () => void;
  runFallback: (line: string) => Promise<string>;
  promptCwd: (shown: string) => void;
  handleOsc: (kind: string, payload: string) => void;
  onInterrupt: () => void;
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
export const stripAnsi = (text: string) => text.replace(ANSI, "");
export const joinPath = (a: string, b: string) => (a ? (b ? `${a}/${b}` : a) : b);

function sameFiles(a: Files, b: Files) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) if (a[key] !== b[key]) return false;
  return true;
}

function reachAll(state: RepoState, tips: string[]) {
  const out = new Set<string>();
  for (const tip of tips) for (const id of gitEngine.reachable(state, tip)) out.add(id);
  return out;
}

/** Spots a push (new commits on GitHub that came from this machine) or a fetch/pull (the reverse). */
function detectTransfer(prev: RepoState, next: RepoState): Omit<PushEvent, "id"> | null {
  const remoteBefore = reachAll(next, Object.values(prev.remote));
  const remoteNow = reachAll(next, Object.values(next.remote));
  const localNow = reachAll(next, Object.values(next.branches));
  const pushed = next.order.filter((id) => remoteNow.has(id) && !remoteBefore.has(id) && localNow.has(id));
  if (pushed.length) {
    const branch = Object.keys(next.remote).find((b) => prev.remote[b] !== next.remote[b]) ?? next.head;
    return { direction: "down", branch, commits: pushed, prev };
  }
  const seenBefore = reachAll(next, [...Object.values(prev.branches), ...Object.values(gitEngine.trk(prev))]);
  const seenNow = reachAll(next, [...Object.values(next.branches), ...Object.values(gitEngine.trk(next))]);
  const fetched = next.order.filter((id) => seenNow.has(id) && !seenBefore.has(id) && remoteBefore.has(id) && next.commits[id].author.startsWith("Teammate"));
  if (fetched.length) return { direction: "up", branch: next.head, commits: fetched, prev };
  return null;
}

function toTree(files: Files): FileSystemTree {
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
  return tree;
}

/** The WebContainer's file system behind the same small interface as the in-memory fallback. */
function containerBox(box: WebContainer): Box {
  return {
    async read(path) {
      try {
        return await box.fs.readFile(path, "utf-8");
      } catch {
        return null;
      }
    },
    async write(path, content) {
      const dir = path.split("/").slice(0, -1).join("/");
      if (dir) await box.fs.mkdir(dir, { recursive: true });
      await box.fs.writeFile(path, content);
    },
    async remove(path) {
      await box.fs.rm(path, { recursive: true, force: true });
    },
    async mkdir(path) {
      await box.fs.mkdir(path, { recursive: true });
    },
    async list(dir) {
      try {
        const entries = await box.fs.readdir(dir || ".", { withFileTypes: true });
        return { files: entries.filter((e) => e.isFile()).map((e) => e.name), dirs: entries.filter((e) => e.isDirectory()).map((e) => e.name) };
      } catch {
        return { files: [], dirs: [] };
      }
    },
    async exists(path) {
      try {
        await box.fs.readFile(path);
        return true;
      } catch {
        try {
          await box.fs.readdir(path);
          return true;
        } catch {
          return false;
        }
      }
    },
  };
}

/** Text files under `folder`, skipping Git's own folders and nested repositories. */
async function collectFiles(box: Box, folder: string, recursive: boolean) {
  const out: string[] = [];
  async function walk(dir: string, prefix: string) {
    const { files, dirs } = await box.list(dir);
    for (const f of files.sort()) {
      if (out.length >= MAX_FILES) return;
      out.push(prefix ? `${prefix}/${f}` : f);
    }
    if (!recursive) return;
    for (const d of dirs.sort()) {
      if (IGNORED_DIRS.includes(d)) continue;
      const full = joinPath(dir, d);
      if (await box.exists(`${full}/.git`)) continue;
      await walk(full, prefix ? `${prefix}/${d}` : d);
    }
  }
  await walk(folder, "");
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

export function WebContainerProvider({ variant, children }: { variant: StudioVariant; children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => buildWorkspace(variant));
  const [mode, setMode] = useState<StudioMode>("booting");
  const [bootMessage, setBootMessage] = useState("Booting WebContainer…");
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [wc, setWc] = useState<WebContainer | null>(null);
  const [session, setSession] = useState(0);
  const [cwd, setCwdState] = useState(workspace.startDir);
  const [repoRoot, setRepoRoot] = useState<string | null>(null);
  const [repo, setRepoState] = useState<RepoState | null>(null);
  const [files, setFilesState] = useState<Files>({});
  const [dirs, setDirs] = useState<string[]>([]);
  const [commands, setCommands] = useState<CommandEvent[]>([]);
  const [facts, setFacts] = useState<ReadonlyMap<string, number>>(new Map());
  const [pushEvent, setPushEvent] = useState<PushEvent | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [devLog, setDevLog] = useState("");
  const [devRunning, setDevRunning] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [commitMessage, setCommitMessage] = useState("feat: update portal UI");
  const [speed, setSpeed] = useState<Speed>(1);

  const boxRef = useRef<Box | null>(null);
  const memRef = useRef<MemBox | null>(null);
  const wcRef = useRef<WebContainer | null>(null);
  const modeRef = useRef<StudioMode>("booting");
  const workspaceRef = useRef(workspace);
  const cwdRef = useRef(workspace.startDir);
  const repoRef = useRef<RepoState | null>(null);
  const rootRef = useRef<string | null>(null);
  const filesRef = useRef<Files>({});
  const folderRef = useRef(workspace.startDir);
  const terminalRef = useRef<TerminalApi | null>(null);
  /** Editor changes not yet written into the sandbox, by full path: a timer, or null while writing. */
  const pendingRef = useRef(new Map<string, ReturnType<typeof setTimeout> | null>());
  const devProcRef = useRef<WebContainerProcess | null>(null);
  const pushCounter = useRef(0);
  const refreshChain = useRef<Promise<void>>(Promise.resolve());
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const globalConfig = useRef<Record<string, string>>({});
  const factsRef = useRef(new Map<string, number>());

  const toRel = useCallback((abs: string) => {
    const workdir = wcRef.current?.workdir ?? `/home/${WORKDIR_NAME}`;
    if (abs === workdir) return "";
    return abs.startsWith(`${workdir}/`) ? abs.slice(workdir.length + 1) : null;
  }, []);

  const reloadPreview = useCallback(() => setPreviewNonce((n) => n + 1), []);
  const schedulePreviewReload = useCallback(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(reloadPreview, 600);
  }, [reloadPreview]);

  const applyRepo = useCallback((next: RepoState | null, root: string | null) => {
    const prev = repoRef.current;
    const sameRoot = root === rootRef.current;
    rootRef.current = root;
    setRepoRoot(root);
    if (prev && next && sameRoot && JSON.stringify(prev) === JSON.stringify(next)) return;
    repoRef.current = next;
    setRepoState(next);
    if (prev && next && sameRoot) {
      const transfer = detectTransfer(prev, next);
      if (transfer) {
        pushCounter.current += 1;
        setPushEvent({ id: pushCounter.current, ...transfer });
      }
    } else setPushEvent(null);
  }, []);

  /** Records milestones the first time they are seen; checklists tick from these, so ticks stick. */
  const noteFacts = useCallback((top: string[], root: string | null, state: RepoState | null, disk: Files) => {
    const facts = factsRef.current;
    const before = facts.size;
    const now = Date.now();
    const add = (key: string) => {
      if (!facts.has(key)) facts.set(key, now);
    };
    top.forEach((d) => add(`dir:${d}`));
    if (root !== null && state) {
      add(`repo:${root}`);
      for (const [name, content] of Object.entries(disk)) {
        add(`file:${root}/${name}`);
        if (content.trim()) add(`filled:${root}/${name}`);
      }
      const st = gitEngine.status(state, disk);
      if (st.staged.length || st.unstaged.length || st.untracked.length) add(`dirty:${root}`);
      st.staged.forEach((c) => add(`staged:${root}/${c.path}`));
      if (state.order.length) add(`commit:${root}`);
      add(`commits:${root}:${state.order.length}`);
      for (const b of Object.keys(state.branches)) add(`branch:${root}:${b}`);
      add(`onbranch:${root}:${state.head}`);
      const main = state.branches.main;
      const onMain = main ? gitEngine.reachable(state, main) : new Set<string>();
      if (Object.entries(state.branches).some(([b, tip]) => b !== "main" && !onMain.has(tip))) add(`branchcommit:${root}`);
      if (main && state.head !== "main" && !state.detached) {
        const mainTree = state.commits[main].files;
        if (Object.keys(disk).some((f) => disk[f] !== mainTree[f])) add(`edited-on-branch:${root}`);
      }
      if (facts.has(`branchcommit:${root}`) && state.head === "main") add(`returned:${root}`);
      const mine = `${state.user.name} <${state.user.email}>`;
      for (const tip of Object.values(state.remote)) {
        for (const id of gitEngine.reachable(state, tip)) {
          const author = state.commits[id].author;
          if (author === mine) add(`pushed:${root}`);
          if (author.startsWith("Teammate")) add(`teammates:${root}`);
        }
      }
    }
    if (facts.size !== before) setFacts(new Map(facts));
  }, []);

  /** Re-reads where the terminal is, which repository that is in, and that folder's files. */
  const refresh = useCallback(() => {
    refreshChain.current = refreshChain.current.then(async () => {
      const box = boxRef.current;
      if (!box) return;
      try {
        const here = cwdRef.current;
        const segs = here ? here.split("/") : [];
        let root: string | null = null;
        for (let k = segs.length; k >= 0; k--) {
          const candidate = segs.slice(0, k).join("/");
          if (await box.exists(joinPath(candidate, ".git/studio.json"))) {
            root = candidate;
            break;
          }
        }
        const stateText = root !== null ? await box.read(joinPath(root, ".git/studio.json")) : null;
        const folder = root ?? here;
        const names = await collectFiles(box, folder, root !== null);
        const disk: Files = {};
        for (const name of names) {
          const content = await box.read(joinPath(folder, name));
          if (content !== null && content.length <= MAX_FILE_BYTES) disk[name] = content;
        }
        const top = (await box.list("")).dirs.filter((d) => !IGNORED_DIRS.includes(d)).sort();
        if (box !== boxRef.current) return;
        const state = stateText ? (JSON.parse(stateText) as RepoState) : null;
        noteFacts(top, root, state, disk);
        applyRepo(state, root);
        // Keep anything typed in the editor that has not reached the sandbox yet.
        const current = folder === folderRef.current ? filesRef.current : {};
        const next: Files = {};
        for (const [name, content] of Object.entries(disk)) next[name] = pendingRef.current.has(joinPath(folder, name)) && name in current ? current[name] : content;
        folderRef.current = folder;
        if (!sameFiles(next, filesRef.current)) {
          filesRef.current = next;
          setFilesState(next);
          schedulePreviewReload();
        }
        setDirs((d) => (d.join("/") === top.join("/") ? d : top));
      } catch {
        // The sandbox may be rebooting; the next command refreshes again.
      }
    });
    return refreshChain.current;
  }, [applyRepo, noteFacts, schedulePreviewReload]);

  const setCwd = useCallback(
    (next: string) => {
      if (next === cwdRef.current) return;
      cwdRef.current = next;
      setCwdState(next);
      void refresh();
    },
    [refresh],
  );

  const promptCwd = useCallback(
    (shown: string) => {
      const rel = toRel(shown.replace(/^~/, "/home"));
      if (rel !== null) setCwd(rel);
    },
    [toRel, setCwd],
  );

  const writeNow = useCallback(
    async (full: string) => {
      const pending = pendingRef.current;
      const timer = pending.get(full);
      if (timer) clearTimeout(timer);
      pending.set(full, null);
      const box = boxRef.current;
      const name = full.slice(folderRef.current ? folderRef.current.length + 1 : 0);
      const content = filesRef.current[name];
      try {
        if (box && content !== undefined) await box.write(full, content);
      } finally {
        if (pending.get(full) === null) pending.delete(full);
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
    (name: string, content: string) => {
      const next = { ...filesRef.current, [name]: content };
      filesRef.current = next;
      setFilesState(next);
      const full = joinPath(folderRef.current, name);
      const pending = pendingRef.current;
      const timer = pending.get(full);
      if (timer) clearTimeout(timer);
      pending.set(
        full,
        setTimeout(() => void writeNow(full), modeRef.current === "container" ? 300 : 0),
      );
    },
    [writeNow],
  );

  const saveFile = useCallback(
    async (name: string) => {
      const folder = folderRef.current;
      await writeNow(joinPath(folder, name));
      // "Write ... and SAVE": the Activity checklists tick when a filled file is saved on purpose.
      if ((filesRef.current[name] ?? "").trim() && !factsRef.current.has(`saved:${folder}/${name}`)) {
        factsRef.current.set(`saved:${folder}/${name}`, Date.now());
        setFacts(new Map(factsRef.current));
      }
      await refresh();
    },
    [writeNow, refresh],
  );

  const createFile = useCallback(
    async (raw: string) => {
      const name = raw.trim().replace(/^\.\//, "");
      if (!/^[\w.-][\w./ -]*$/.test(name) || name.includes("..") || name.startsWith(".git")) return "Use letters, numbers, dots, dashes or slashes.";
      if (name in filesRef.current) return "That file already exists.";
      const box = boxRef.current;
      if (!box) return "The sandbox is still starting.";
      await box.write(joinPath(folderRef.current, name), "");
      await refresh();
      return null;
    },
    [refresh],
  );

  const recordCommand = useCallback((event: CommandEvent) => {
    setCommands((list) => [...list.slice(-199), event]);
  }, []);

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

  const stopDevServer = useCallback(() => {
    const proc = devProcRef.current;
    devProcRef.current = null;
    if (proc) {
      try {
        proc.kill();
      } catch {
        // Already gone.
      }
    } else if (modeRef.current === "container") {
      // Started by hand in the terminal: interrupt it there.
      terminalRef.current?.interrupt();
    }
    setServerUrl(null);
    setDevRunning(false);
    setDevLog("");
    terminalRef.current?.note("\x1b[31m[stopped]\x1b[0m npm run dev terminated.");
  }, []);

  const startDevServer = useCallback(async () => {
    await flushWrites();
    const box = boxRef.current;
    const dir = rootRef.current ?? cwdRef.current;
    if (!workspaceRef.current.allowDev || !box || !(await box.exists(joinPath(dir, "package.json")))) {
      terminalRef.current?.note("\x1b[33mnpm run dev needs a folder with a package.json (try the portal project).\x1b[0m");
      return;
    }
    if (modeRef.current === "fallback") {
      setServerUrl("fallback");
      setDevRunning(true);
      setDevLog(`> itclub-portal@1.0.0 dev\n> node server.js\n\n  ITClub portal dev server ready (built-in preview)\n  ➜  Local:   http://localhost:${DEV_PORT}/\n`);
      terminalRef.current?.note("\x1b[2m[background] npm run dev started. Watch it in the Live Preview.\x1b[0m");
      return;
    }
    const container = wcRef.current;
    if (!container) return;
    if (devProcRef.current || serverUrl) {
      terminalRef.current?.note("\x1b[2m[background] The dev server is already running.\x1b[0m");
      return;
    }
    setDevLog("");
    setDevRunning(true);
    terminalRef.current?.note("\x1b[2m[background] npm run dev started. Watch it in the Live Preview.\x1b[0m");
    const proc = await container.spawn("npm", ["run", "dev"], { cwd: dir || undefined });
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
        setServerUrl(null);
        setDevRunning(false);
      }
    };
    proc.exit.then(stopped, stopped);
  }, [flushWrites, serverUrl]);

  /** Ctrl+C in the terminal also stops a dev server that was started from the helper button. */
  const onInterrupt = useCallback(() => {
    if (devProcRef.current || (modeRef.current === "fallback" && serverUrl)) stopDevServer();
  }, [serverUrl, stopDevServer]);

  /** `git clone` from inside the container: fetch on the page, write the files, report back. */
  const handleClone = useCallback(
    async (payload: { id: string; url: string; dest: string; user: { name: string; email: string } }) => {
      const box = boxRef.current;
      if (!box) return;
      const destRel = toRel(payload.dest);
      const result = destRel === null ? ({ ok: false, out: "fatal: clone into a folder inside the workspace" } as const) : await resolveClone(payload.url, payload.user);
      if (result.ok && destRel !== null) {
        for (const [path, content] of Object.entries(result.files)) await box.write(joinPath(destRel, path), content);
        await box.write(joinPath(destRel, ".git/studio.json"), JSON.stringify(result.state));
      }
      await box.write(`.studio/clone-${payload.id}.json`, JSON.stringify({ ok: result.ok, out: result.out }));
    },
    [toRel],
  );

  const handleOsc = useCallback(
    (kind: string, payload: string) => {
      try {
        const data = JSON.parse(payload);
        if (kind === "sync") {
          const root = data.root ? toRel(data.root) : null;
          const here = data.cwd ? toRel(data.cwd) : null;
          recordCommand({ cmd: data.cmd ?? "", args: data.args ?? [], code: data.code ?? 0, root, at: Date.now() });
          if (here !== null && here !== cwdRef.current) setCwd(here);
          else void refresh();
        } else if (kind === "clone") void handleClone(data);
      } catch {
        void refresh();
      }
    },
    [handleClone, recordCommand, refresh, setCwd, toRel],
  );

  const runFallback = useCallback(
    async (line: string) => {
      const mem = memRef.current;
      if (!mem) return "";
      const result = await runFallbackLine(line, {
        mem,
        cwd: cwdRef.current,
        globalConfig: globalConfig.current,
        clone: (url, user) => resolveClone(url, user),
        startDev: () => void startDevServer(),
      });
      if (result.command) recordCommand({ ...result.command, at: Date.now() });
      if (result.cwd !== cwdRef.current) {
        cwdRef.current = result.cwd;
        setCwdState(result.cwd);
      }
      await refresh();
      return result.out;
    },
    [recordCommand, refresh, startDevServer],
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
    setServerUrl(null);
    setDevLog("");
    setDevRunning(false);
    setPushEvent(null);
    setCommands([]);
    factsRef.current = new Map();
    setFacts(new Map());
    const fresh = buildWorkspace(variant);
    workspaceRef.current = fresh;
    setWorkspace(fresh);
    if (modeRef.current === "container") {
      modeRef.current = "booting";
      setMode("booting");
      setBootMessage("Resetting the sandbox…");
    }
    setSession((n) => n + 1);
  }, [variant]);

  // Boot (or reuse) the WebContainer and lay out this studio's workspace, or fall back.
  useEffect(() => {
    let cancelled = false;
    let watcher: { close(): void } | null = null;
    let watchTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe: (() => void)[] = [];
    const g = globalThis as BootGlobal;
    const ws = workspaceRef.current;

    const startFallback = (reason: string) => {
      if (cancelled) return;
      const mem = new MemBox(ws.files);
      memRef.current = mem;
      boxRef.current = mem;
      cwdRef.current = ws.startDir;
      setCwdState(ws.startDir);
      modeRef.current = "fallback";
      setFallbackReason(reason);
      setMode("fallback");
      void refresh();
    };

    async function start() {
      await Promise.resolve();
      if (new URLSearchParams(window.location.search).get("engine") === "builtin") {
        startFallback("Running the built-in Git engine (?engine=builtin in the URL). Remove it to boot the full WebContainer sandbox.");
        return;
      }
      if (!window.crossOriginIsolated) {
        startFallback("This tab is not cross-origin isolated, so the browser blocks WebContainers. The built-in Git engine is running instead.");
        return;
      }
      try {
        const { WebContainer } = await import("@webcontainer/api");
        g.__gitStudioBoot ??= WebContainer.boot({ workdirName: WORKDIR_NAME });
        const container = await withTimeout(g.__gitStudioBoot, 45_000, "Booting WebContainer");
        if (cancelled) return;
        setBootMessage("Preparing your workspace…");
        // Clear whatever an earlier studio on this page left behind, then lay out this one.
        for (const name of await container.fs.readdir(".")) await container.fs.rm(name, { recursive: true, force: true });
        await container.mount(toTree({ ...ws.files, ".studio/bin/git": buildGitCli(createMiniGit.toString()) }));
        try {
          const chmod = await container.spawn("chmod", ["+x", ".studio/bin/git"]);
          await chmod.exit;
        } catch {
          // jsh runs node scripts without the bit too.
        }
        if (cancelled) return;
        unsubscribe.push(container.on("server-ready", (_port, url) => setServerUrl(url)));
        unsubscribe.push(
          container.on("port", (_port, type) => {
            if (type === "close") {
              setServerUrl(null);
              setDevRunning(false);
            }
          }),
        );
        try {
          // Picks up edits made from the shell (echo, touch, mkdir, rm) so the editor stays true.
          watcher = container.fs.watch(".", { recursive: true }, (_event, name) => {
            if (/(^|\/)(node_modules|\.studio)(\/|$)/.test(String(name))) return;
            if (watchTimer) clearTimeout(watchTimer);
            watchTimer = setTimeout(() => void refresh(), 250);
          });
        } catch {
          watcher = null;
        }
        wcRef.current = container;
        boxRef.current = containerBox(container);
        memRef.current = null;
        cwdRef.current = ws.startDir;
        setCwdState(ws.startDir);
        modeRef.current = "container";
        setWc(container);
        setMode("container");
        void refresh();
      } catch (error) {
        g.__gitStudioBoot = null;
        startFallback(`WebContainer could not start (${error instanceof Error ? error.message : String(error)}). The built-in Git engine is running instead.`);
      }
    }

    void start();
    return () => {
      cancelled = true;
      unsubscribe.forEach((off) => off());
      watcher?.close();
      if (watchTimer) clearTimeout(watchTimer);
    };
  }, [session, refresh]);

  // Leaving the page (or this lesson) stops the dev server so it does not run on unseen.
  useEffect(
    () => () => {
      try {
        devProcRef.current?.kill();
      } catch {
        // Already stopped.
      }
      if (previewTimer.current) clearTimeout(previewTimer.current);
    },
    [],
  );

  const status = useMemo(() => (repo ? gitEngine.status(repo, files) : null), [repo, files]);
  const folder = repoRoot ?? cwd;

  const value = useMemo<StudioContextValue>(
    () => ({
      variant,
      workspace,
      mode,
      bootMessage,
      fallbackReason,
      wc,
      session,
      cwd,
      repoRoot,
      folder,
      repo,
      files,
      dirs,
      status,
      commands,
      facts,
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
      createFile,
      saveFile,
      flushWrites,
      refresh,
      runCommand,
      registerTerminal,
      startDevServer,
      stopDevServer,
      reloadPreview,
      runFallback,
      promptCwd,
      handleOsc,
      onInterrupt,
      reset,
    }),
    [
      variant,
      workspace,
      mode,
      bootMessage,
      fallbackReason,
      wc,
      session,
      cwd,
      repoRoot,
      folder,
      repo,
      files,
      dirs,
      status,
      commands,
      facts,
      pushEvent,
      finishPush,
      serverUrl,
      devLog,
      devRunning,
      previewNonce,
      commitMessage,
      speed,
      updateFile,
      createFile,
      saveFile,
      flushWrites,
      refresh,
      runCommand,
      registerTerminal,
      startDevServer,
      stopDevServer,
      reloadPreview,
      runFallback,
      promptCwd,
      handleOsc,
      onInterrupt,
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
