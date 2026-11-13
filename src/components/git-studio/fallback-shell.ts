import { createMiniGit, type Files, type GitIo, type RepoState } from "./engine/mini-git";
import { IGNORED_DIRS } from "./engine/sandbox-files";
import type { CloneResult } from "./engine/workspaces";

const engine = createMiniGit();

/** The few file operations the studio needs, served by the WebContainer or by MemBox. */
export type Box = {
  read(path: string): Promise<string | null>;
  write(path: string, content: string): Promise<void>;
  remove(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  list(dir: string): Promise<{ files: string[]; dirs: string[] }>;
  exists(path: string): Promise<boolean>;
};

const join = (a: string, b: string) => (a ? (b ? `${a}/${b}` : a) : b);

/** An in-memory workspace for when WebContainers cannot run. Paths are relative, "" is the root. */
export class MemBox implements Box {
  files = new Map<string, string>();
  dirs = new Set<string>();

  constructor(initial: Files = {}) {
    for (const [path, content] of Object.entries(initial)) this.writeSync(path, content);
  }

  private addParents(path: string) {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i++) this.dirs.add(parts.slice(0, i).join("/"));
  }
  writeSync(path: string, content: string) {
    this.files.set(path, content);
    this.addParents(path);
  }
  readSync(path: string) {
    return this.files.get(path) ?? null;
  }
  removeSync(path: string) {
    this.files.delete(path);
    for (const key of [...this.files.keys()]) if (key.startsWith(`${path}/`)) this.files.delete(key);
    for (const dir of [...this.dirs]) if (dir === path || dir.startsWith(`${path}/`)) this.dirs.delete(dir);
  }
  mkdirSync(path: string) {
    if (!path) return;
    this.dirs.add(path);
    this.addParents(path);
  }
  isDir(path: string) {
    return path === "" || this.dirs.has(path);
  }
  listSync(dir: string) {
    const prefix = dir ? `${dir}/` : "";
    const files: string[] = [];
    const dirs: string[] = [];
    for (const key of this.files.keys()) if (key.startsWith(prefix) && !key.slice(prefix.length).includes("/")) files.push(key.slice(prefix.length));
    for (const d of this.dirs) if (d.startsWith(prefix) && d !== dir && !d.slice(prefix.length).includes("/")) dirs.push(d.slice(prefix.length));
    return { files: files.sort(), dirs: dirs.sort() };
  }

  async read(path: string) {
    return this.readSync(path);
  }
  async write(path: string, content: string) {
    this.writeSync(path, content);
  }
  async remove(path: string) {
    this.removeSync(path);
  }
  async mkdir(path: string) {
    this.mkdirSync(path);
  }
  async list(dir: string) {
    return this.listSync(dir);
  }
  async exists(path: string) {
    return this.files.has(path) || this.isDir(path);
  }
}

/** Files under a repository root, leaving out Git's folders and nested repositories. */
function repoFiles(mem: MemBox, root: string) {
  const out: string[] = [];
  const walk = (dir: string, prefix: string) => {
    const { files, dirs } = mem.listSync(dir);
    for (const f of files) out.push(prefix ? `${prefix}/${f}` : f);
    for (const d of dirs) {
      if (IGNORED_DIRS.includes(d)) continue;
      const full = join(dir, d);
      if (mem.isDir(`${full}/.git`)) continue;
      walk(full, prefix ? `${prefix}/${d}` : d);
    }
  };
  walk(root, "");
  return out;
}

function resolvePath(cwd: string, target: string) {
  if (!target || target === "~" || target === "/" || target === "~/") return "";
  const parts = target.startsWith("/") || target.startsWith("~/") ? [] : cwd ? cwd.split("/") : [];
  for (const part of target.replace(/^~\//, "").replace(/^\//, "").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function findRoot(mem: MemBox, cwd: string) {
  const segs = cwd ? cwd.split("/") : [];
  for (let k = segs.length; k >= 0; k--) {
    const candidate = segs.slice(0, k).join("/");
    if (mem.files.has(join(candidate, ".git/studio.json"))) return candidate;
  }
  return null;
}

type Ctx = {
  mem: MemBox;
  cwd: string;
  globalConfig: Record<string, string>;
  clone: (url: string, user: { name: string; email: string }) => Promise<CloneResult>;
  startDev: () => void;
};

export type FallbackResult = { out: string; cwd: string; command?: { cmd: string; args: string[]; code: number; root: string | null } };

const HELP = [
  "This lightweight shell understands:",
  "  git <command>              the studio Git (try: git help)",
  "  ls, cd, pwd, mkdir, touch, cat, rm, echo text > file",
  "  npm install, npm run dev   (in the portal project)",
  "  clear",
].join("\n");

/** Splits on whitespace, honouring quotes. */
function split(line: string) {
  return engine.splitArgs(line);
}

/** Runs one line in the fallback shell (supports `a && b`). */
export async function runFallbackLine(line: string, ctx: Ctx): Promise<FallbackResult> {
  let cwd = ctx.cwd;
  let out = "";
  let command: FallbackResult["command"];
  for (const part of line.split(/\s+&&\s+/)) {
    const r = await runOne(part.trim(), { ...ctx, cwd });
    out += r.out;
    cwd = r.cwd;
    if (r.command) command = r.command;
    if (r.code !== 0) break;
  }
  return { out, cwd, command };
}

async function runOne(line: string, ctx: Ctx): Promise<FallbackResult & { code: number }> {
  const { mem } = ctx;
  let cwd = ctx.cwd;
  const args = split(line);
  const [cmd, ...rest] = args;
  const ok = (out = "") => ({ out, cwd, code: 0 });
  const bad = (out: string, code = 1) => ({ out, cwd, code });
  const user = { name: ctx.globalConfig["user.name"] || "ITCamp Student", email: ctx.globalConfig["user.email"] || "student@itclub.dev" };

  switch (cmd) {
    case undefined:
      return ok();
    case "pwd":
      return ok(`/home/itcamp${cwd ? `/${cwd}` : ""}\n`);
    case "help":
      return ok(`${HELP}\n`);
    case "ls": {
      const all = rest.some((a) => /^-\w*a/.test(a));
      const target = resolvePath(cwd, rest.find((a) => !a.startsWith("-")) ?? "");
      if (!mem.isDir(target)) return bad(`ls: cannot access '${target}': No such file or directory\n`);
      const { files, dirs } = mem.listSync(target);
      const names = [...dirs.map((d) => `\x1b[34m${d}/\x1b[0m`), ...files].filter((n) => all || !stripStyle(n).startsWith("."));
      return ok(names.length ? `${names.join("  ")}\n` : "");
    }
    case "cd": {
      const target = resolvePath(cwd, rest[0] ?? "");
      if (!mem.isDir(target)) return bad(`cd: no such file or directory: ${rest[0]}\n`);
      cwd = target;
      return ok();
    }
    case "mkdir": {
      for (const name of rest.filter((a) => !a.startsWith("-"))) {
        const path = resolvePath(cwd, name);
        if (mem.files.has(path) || (mem.isDir(path) && !rest.includes("-p"))) return bad(`mkdir: cannot create directory '${name}': File exists\n`);
        mem.mkdirSync(path);
      }
      return ok();
    }
    case "touch": {
      for (const name of rest) {
        const path = resolvePath(cwd, name);
        if (!mem.files.has(path)) mem.writeSync(path, "");
      }
      return ok();
    }
    case "cat": {
      let text = "";
      for (const name of rest) {
        const content = mem.readSync(resolvePath(cwd, name));
        text += content ?? `cat: ${name}: No such file or directory\n`;
      }
      return ok(text);
    }
    case "rm": {
      for (const name of rest.filter((a) => !a.startsWith("-"))) {
        const path = resolvePath(cwd, name);
        if (mem.isDir(path) && path && !rest.some((a) => /^-\w*r/.test(a))) return bad(`rm: cannot remove '${name}': Is a directory\n`);
        if (!mem.files.has(path) && !mem.isDir(path)) return bad(`rm: cannot remove '${name}': No such file or directory\n`);
        mem.removeSync(path);
      }
      return ok();
    }
    case "echo": {
      const redirect = rest.findIndex((a) => a === ">" || a === ">>");
      if (redirect === -1) return ok(`${rest.join(" ")}\n`);
      const text = `${rest.slice(0, redirect).join(" ")}\n`;
      const path = resolvePath(cwd, rest[redirect + 1] ?? "");
      if (!path) return bad("echo: missing file after >\n");
      mem.writeSync(path, rest[redirect] === ">>" ? `${mem.readSync(path) ?? ""}${text}` : text);
      return ok();
    }
    case "node":
      return rest[0] === "-v" || rest[0] === "--version" ? ok("v20.11.1\n") : bad("node: only `node -v` works in the lightweight shell\n");
    case "npm":
      if (rest[0] === "install" || rest[0] === "i") return ok("\nup to date, audited 1 package in 214ms\n\nfound 0 vulnerabilities\n");
      if ((rest[0] === "run" && (rest[1] === "dev" || rest[1] === "start")) || rest[0] === "start") {
        ctx.startDev();
        return ok();
      }
      return bad("npm: try `npm install` or `npm run dev`\n");
    case "git":
      return runGit(rest, ctx, user);
    default:
      return bad(`${cmd}: command not found\n${HELP}\n`, 127);
  }
}

function stripStyle(text: string) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

async function runGit(args: string[], ctx: Ctx, user: { name: string; email: string }): Promise<FallbackResult & { code: number }> {
  const { mem, cwd } = ctx;
  const sub = args[0];
  const root = findRoot(mem, cwd);
  const done = (out: string, code: number, at: string | null) => ({ out, cwd, code, command: { cmd: sub ?? "", args: args.slice(1), code, root: at } });

  if (sub === "config" && args.includes("--global")) {
    const rest = args.slice(1).filter((a) => a !== "--global");
    const [key, ...value] = rest;
    if (key !== "user.name" && key !== "user.email") return done("This sandbox only stores user.name and user.email.\n", 1, root);
    if (!value.length) return done(ctx.globalConfig[key] ? `${ctx.globalConfig[key]}\n` : "", ctx.globalConfig[key] ? 0 : 1, root);
    ctx.globalConfig[key] = value.join(" ");
    if (root !== null) {
      const state = JSON.parse(mem.readSync(join(root, ".git/studio.json"))!) as RepoState;
      state.user = { ...state.user, [key === "user.name" ? "name" : "email"]: value.join(" ") };
      mem.writeSync(join(root, ".git/studio.json"), JSON.stringify(state));
    }
    return done("", 0, root);
  }

  if (sub === "init") {
    if (mem.files.has(join(cwd, ".git/studio.json"))) return done(`Reinitialized existing Git repository in /home/itcamp/${cwd}/.git/\n`, 0, cwd);
    mem.writeSync(join(cwd, ".git/studio.json"), JSON.stringify(engine.emptyState(user)));
    return done(`Initialized empty Git repository in /home/itcamp${cwd ? `/${cwd}` : ""}/.git/\n`, 0, cwd);
  }

  if (sub === "clone") {
    const positional = args.slice(1).filter((a) => !a.startsWith("-"));
    const url = positional[0];
    if (!url) return done("usage: git clone <repository-url> [<folder>]\n", 129, root);
    const name = positional[1] || url.replace(/\/+$/, "").split("/").pop()!.replace(/\.git$/, "");
    const dest = join(cwd, name);
    if (mem.isDir(dest) && (mem.listSync(dest).files.length || mem.listSync(dest).dirs.length)) {
      return done(`fatal: destination path '${name}' already exists and is not an empty directory.\n`, 128, root);
    }
    const result = await ctx.clone(url, user);
    if (!result.ok) return done(`Cloning into '${name}'...\n${result.out}\n`, 128, root);
    for (const [path, content] of Object.entries(result.files)) mem.writeSync(join(dest, path), content);
    mem.writeSync(join(dest, ".git/studio.json"), JSON.stringify(result.state));
    return done(`Cloning into '${name}'...\n${result.out}\n`, 0, dest);
  }

  if (root === null) {
    if (sub === undefined || ["help", "--help", "-h", "--version", "version"].includes(sub)) {
      const r = engine.run(args, engine.emptyState(), { list: () => [], read: () => null, write: () => {}, remove: () => {}, now: () => Date.now() });
      return done(r.out, r.code, null);
    }
    return done("fatal: not a git repository (or any of the parent directories): .git\n\x1b[33mhint: run git init to make this folder a repository, or cd into one.\x1b[0m\n", 128, null);
  }

  const statePath = join(root, ".git/studio.json");
  const state = JSON.parse(mem.readSync(statePath)!) as RepoState;
  const io: GitIo = {
    list: () => repoFiles(mem, root),
    read: (p) => mem.readSync(join(root, p)),
    write: (p, c) => mem.writeSync(join(root, p), c),
    remove: (p) => mem.removeSync(join(root, p)),
    now: () => Date.now(),
  };
  const result = engine.run(args, state, io);
  if (result.changed) mem.writeSync(statePath, JSON.stringify(result.state));
  return done(result.out, result.code, root);
}
