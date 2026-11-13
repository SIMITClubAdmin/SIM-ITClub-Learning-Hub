import { IGNORED_DIRS } from "./sandbox-files";

/**
 * The `git` command mounted in the WebContainer at .studio/bin/git: the shared engine plus Node
 * glue that reads the real sandbox files. Every repository keeps its state in
 * <repo>/.git/studio.json, so `git init` and `git clone` can make as many as a student likes.
 *
 * After each run it prints a private OSC escape (ESC ] 7777 ; sync ; {json} BEL) that xterm.js
 * swallows and the studio uses to refresh the graph. `git clone` cannot reach GitHub from inside
 * the container, so it asks the page (ESC ] 7777 ; clone ; {json} BEL) and waits for the page
 * to write the files plus a small result file in .studio/.
 */
export function buildGitCli(engineSource: string) {
  return `#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const createMiniGit = ${engineSource};
const git = createMiniGit();
const SKIP = new Set(${JSON.stringify(IGNORED_DIRS)});
const STUDIO = path.resolve(__dirname, "..");
const GLOBAL = path.join(STUDIO, "gitconfig.json");
const argv = process.argv.slice(2);
const cmd = argv[0];
const here = process.cwd();

function osc(kind, payload) {
  process.stdout.write("\\x1b]7777;" + kind + ";" + JSON.stringify(payload) + "\\x07");
}
function say(text) {
  if (text) process.stdout.write(text.endsWith("\\n") ? text : text + "\\n");
}
function finish(root, code) {
  osc("sync", { root: root || "", cwd: here, cmd: cmd || "", args: argv.slice(1), code: code });
  process.exitCode = code;
}
function readGlobal() {
  try { return JSON.parse(fs.readFileSync(GLOBAL, "utf8")); } catch { return {}; }
}
function globalUser() {
  const g = readGlobal();
  return { name: g["user.name"] || "ITCamp Student", email: g["user.email"] || "student@itclub.dev" };
}
function findRoot(dir) {
  for (;;) {
    if (fs.existsSync(path.join(dir, ".git", "studio.json"))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}
function walk(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = prefix ? prefix + "/" + entry.name : entry.name;
    // A folder with its own .git is another repository: leave it out, like real Git.
    if (entry.isDirectory()) {
      if (!fs.existsSync(path.join(full, ".git"))) walk(full, rel, out);
    } else if (entry.isFile()) out.push(rel);
  }
  return out;
}
function makeIo(root) {
  return {
    list: () => walk(root, "", []),
    read: (p) => { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return null; } },
    write: (p, content) => {
      const file = path.join(root, p);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    },
    remove: (p) => { try { fs.unlinkSync(path.join(root, p)); } catch {} },
    now: () => Date.now(),
  };
}
function saveState(root, state) {
  fs.mkdirSync(path.join(root, ".git"), { recursive: true });
  fs.writeFileSync(path.join(root, ".git", "studio.json"), JSON.stringify(state));
}

const root = findRoot(here);

if (cmd === "config" && argv.includes("--global")) {
  const g = readGlobal();
  const rest = argv.slice(1).filter((a) => a !== "--global");
  const key = rest[0];
  const value = rest.slice(1).join(" ");
  if (rest.includes("--list") || rest.includes("-l")) {
    for (const k of Object.keys(g)) say(k + "=" + g[k]);
    finish(root, 0);
  } else if (key !== "user.name" && key !== "user.email") {
    say("This sandbox only stores user.name and user.email.");
    finish(root, 1);
  } else if (!value) {
    if (g[key]) say(g[key]);
    finish(root, g[key] ? 0 : 1);
  } else {
    g[key] = value;
    fs.mkdirSync(STUDIO, { recursive: true });
    fs.writeFileSync(GLOBAL, JSON.stringify(g));
    if (root) {
      const state = JSON.parse(fs.readFileSync(path.join(root, ".git", "studio.json"), "utf8"));
      state.user = Object.assign({}, state.user, key === "user.name" ? { name: value } : { email: value });
      saveState(root, state);
    }
    finish(root, 0);
  }
} else if (cmd === "init") {
  if (fs.existsSync(path.join(here, ".git", "studio.json"))) {
    say("Reinitialized existing Git repository in " + here + "/.git/");
    finish(here, 0);
  } else {
    const state = git.emptyState(globalUser());
    const b = argv.indexOf("-b") > -1 ? argv[argv.indexOf("-b") + 1] : (argv.find((a) => a.startsWith("--initial-branch=")) || "").slice(17);
    if (b) state.head = b;
    saveState(here, state);
    say("Initialized empty Git repository in " + here + "/.git/");
    finish(here, 0);
  }
} else if (cmd === "clone") {
  const args = argv.slice(1).filter((a) => !a.startsWith("-"));
  const url = args[0];
  if (!url) {
    say("usage: git clone <repository-url> [<folder>]");
    finish(root, 129);
  } else {
    const name = args[1] || url.replace(/\\/+$/, "").split("/").pop().replace(/\\.git$/, "");
    const dest = path.resolve(here, name);
    if (fs.existsSync(dest) && fs.readdirSync(dest).length) {
      say("fatal: destination path '" + name + "' already exists and is not an empty directory.");
      finish(root, 128);
    } else {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const result = path.join(STUDIO, "clone-" + id + ".json");
      say("Cloning into '" + name + "'...");
      osc("clone", { id: id, url: url, dest: dest, user: globalUser() });
      const started = Date.now();
      const poll = () => {
        if (fs.existsSync(result)) {
          let r = { ok: false, out: "fatal: clone failed" };
          try { r = JSON.parse(fs.readFileSync(result, "utf8")); } catch {}
          try { fs.unlinkSync(result); } catch {}
          say(r.out);
          finish(r.ok ? dest : root, r.ok ? 0 : 128);
        } else if (Date.now() - started > 60000) {
          say("fatal: the clone timed out");
          finish(root, 128);
        } else setTimeout(poll, 120);
      };
      poll();
    }
  }
} else if (!root && (cmd === undefined || ["help", "--help", "-h", "--version", "version"].includes(cmd))) {
  const result = git.run(argv, git.emptyState(), makeIo(here));
  process.stdout.write(result.out);
  finish(null, result.code);
} else if (!root) {
  say("fatal: not a git repository (or any of the parent directories): .git");
  say("\\x1b[33mhint: run git init to make this folder a repository, or cd into one.\\x1b[0m");
  finish(null, 128);
} else {
  const statePath = path.join(root, ".git", "studio.json");
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const result = git.run(argv, state, makeIo(root));
  if (result.changed) fs.writeFileSync(statePath, JSON.stringify(result.state));
  process.stdout.write(result.out);
  finish(root, result.code);
}
`;
}
