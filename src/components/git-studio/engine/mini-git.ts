/**
 * A small, teaching-sized Git. It keeps real snapshots, a staging area, branches, merges
 * (with conflict markers) and a pretend `origin` on GitHub, which is all the studio needs.
 *
 * The whole engine lives inside one function on purpose: the studio turns it into source
 * text with `createMiniGit.toString()` and mounts it into the WebContainer as the `git`
 * command, and the same function runs in the browser when WebContainers are unavailable.
 * So nothing inside may reference imports or module-level values.
 */

export type Files = Record<string, string>;

export type Commit = {
  id: string;
  sha: string;
  message: string;
  parents: string[];
  /** The branch HEAD was on when this commit was made; the graph draws a lane per branch. */
  branch: string;
  time: number;
  author: string;
  files: Files;
};

export type RepoState = {
  v: 1;
  /** Current branch, or "" when HEAD is detached. */
  head: string;
  detached: string | null;
  branches: Record<string, string>;
  /** origin/<branch> -> commit id. */
  remote: Record<string, string>;
  commits: Record<string, Commit>;
  order: string[];
  index: Files;
  merging: { theirs: string; branch: string; unresolved: string[] } | null;
  next: number;
  remoteUrl: string;
  user: { name: string; email: string };
};

export type GitIo = {
  list(): string[];
  read(path: string): string | null;
  write(path: string, content: string): void;
  remove(path: string): void;
  now(): number;
};

export type FileChange = { path: string; kind: "A" | "M" | "D" };

export type RepoStatus = {
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
  conflicted: string[];
};

export type GitResult = { state: RepoState; out: string; code: number; changed: boolean };

export type MiniGit = ReturnType<typeof createMiniGit>;

export function createMiniGit() {
  const RED = "\x1b[31m";
  const GREEN = "\x1b[32m";
  const YELLOW = "\x1b[33m";
  const BLUE = "\x1b[34m";
  const MAGENTA = "\x1b[35m";
  const CYAN = "\x1b[36m";
  const DIM = "\x1b[2m";
  const BOLD = "\x1b[1m";
  const RESET = "\x1b[0m";
  const REMOTE_URL = "https://github.com/sim-itclub/portal.git";

  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  function fnv(text: string, seed: number) {
    let h = (0x811c9dc5 ^ seed) >>> 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }

  function makeSha(text: string) {
    let sha = "";
    for (let i = 0; i < 5; i++) sha += fnv(text, i * 0x9e3779b1);
    return sha;
  }

  function sortedKeys(...maps: Files[]) {
    const keys = new Set<string>();
    for (const map of maps) for (const key of Object.keys(map)) keys.add(key);
    return Array.from(keys).sort();
  }

  function sameTree(a: Files, b: Files) {
    const keys = sortedKeys(a, b);
    for (const key of keys) if (a[key] !== b[key]) return false;
    return true;
  }

  function plural(n: number, word: string) {
    return `${n} ${word}${n === 1 ? "" : "s"}`;
  }

  function lines(text: string | undefined) {
    if (text === undefined || text === "") return [];
    const parts = text.split("\n");
    if (parts[parts.length - 1] === "") parts.pop();
    return parts;
  }

  /** Longest-common-subsequence table walked into a list of keep / delete / insert ops. */
  function diffLines(a: string[], b: string[]) {
    const n = a.length;
    const m = b.length;
    const table: number[][] = [];
    for (let i = 0; i <= n; i++) table.push(new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    const ops: { op: " " | "-" | "+"; text: string; ai: number; bi: number }[] = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        ops.push({ op: " ", text: a[i], ai: i, bi: j });
        i++;
        j++;
      } else if (table[i + 1][j] >= table[i][j + 1]) {
        ops.push({ op: "-", text: a[i], ai: i, bi: j });
        i++;
      } else {
        ops.push({ op: "+", text: b[j], ai: i, bi: j });
        j++;
      }
    }
    while (i < n) ops.push({ op: "-", text: a[i], ai: i++, bi: j });
    while (j < m) ops.push({ op: "+", text: b[j], ai: i, bi: j++ });
    return ops;
  }

  /** Maps each line of `base` to its matching line in `other`, or -1. */
  function matchLines(base: string[], other: string[]) {
    const map: number[] = new Array(base.length).fill(-1);
    for (const op of diffLines(base, other)) if (op.op === " ") map[op.ai] = op.bi;
    return map;
  }

  function countChanges(before: Files, after: Files) {
    let files = 0;
    let added = 0;
    let removed = 0;
    for (const path of sortedKeys(before, after)) {
      if (before[path] === after[path]) continue;
      files++;
      for (const op of diffLines(lines(before[path]), lines(after[path]))) {
        if (op.op === "+") added++;
        if (op.op === "-") removed++;
      }
    }
    return { files, added, removed };
  }

  function changeSummary(before: Files, after: Files) {
    const { files, added, removed } = countChanges(before, after);
    let text = ` ${plural(files, "file")} changed`;
    if (added) text += `, ${added} insertion${added === 1 ? "" : "s"}(+)`;
    if (removed) text += `, ${removed} deletion${removed === 1 ? "" : "s"}(-)`;
    return text;
  }

  function unifiedDiff(path: string, before: string | undefined, after: string | undefined) {
    const ops = diffLines(lines(before), lines(after));
    const out: string[] = [`${BOLD}diff --git a/${path} b/${path}${RESET}`];
    if (before === undefined) out.push(`${BOLD}new file${RESET}`);
    if (after === undefined) out.push(`${BOLD}deleted file${RESET}`);
    out.push(`${BOLD}--- ${before === undefined ? "/dev/null" : `a/${path}`}${RESET}`);
    out.push(`${BOLD}+++ ${after === undefined ? "/dev/null" : `b/${path}`}${RESET}`);
    const CONTEXT = 3;
    let k = 0;
    while (k < ops.length) {
      while (k < ops.length && ops[k].op === " ") k++;
      if (k >= ops.length) break;
      const start = Math.max(0, k - CONTEXT);
      let end = k;
      let quiet = 0;
      while (end < ops.length && quiet <= CONTEXT * 2) {
        quiet = ops[end].op === " " ? quiet + 1 : 0;
        end++;
      }
      end = Math.min(ops.length, end - Math.max(0, quiet - CONTEXT));
      const hunk = ops.slice(start, end);
      const aStart = hunk[0].ai + 1;
      const bStart = hunk[0].bi + 1;
      const aLen = hunk.filter((o) => o.op !== "+").length;
      const bLen = hunk.filter((o) => o.op !== "-").length;
      out.push(`${CYAN}@@ -${aStart},${aLen} +${bStart},${bLen} @@${RESET}`);
      for (const o of hunk) {
        if (o.op === "+") out.push(`${GREEN}+${o.text}${RESET}`);
        else if (o.op === "-") out.push(`${RED}-${o.text}${RESET}`);
        else out.push(` ${o.text}`);
      }
      k = end;
    }
    return out.join("\n");
  }

  /** Three-way line merge: changes on one side win, changes on both sides become conflict markers. */
  function mergeText(base: string, ours: string, theirs: string, theirsLabel: string) {
    const b = lines(base);
    const o = lines(ours);
    const t = lines(theirs);
    const mo = matchLines(b, o);
    const mt = matchLines(b, t);
    const out: string[] = [];
    let conflict = false;
    let pb = -1;
    let po = -1;
    let pt = -1;
    const eq = (x: string[], y: string[]) => x.length === y.length && x.every((line, i) => line === y[i]);
    const flush = (nb: number, no: number, nt: number) => {
      const rb = b.slice(pb + 1, nb);
      const ro = o.slice(po + 1, no);
      const rt = t.slice(pt + 1, nt);
      if (eq(ro, rb)) out.push(...rt);
      else if (eq(rt, rb) || eq(ro, rt)) out.push(...ro);
      else {
        conflict = true;
        out.push("<<<<<<< HEAD", ...ro, "=======", ...rt, `>>>>>>> ${theirsLabel}`);
      }
    };
    for (let i = 0; i < b.length; i++) {
      if (mo[i] === -1 || mt[i] === -1) continue;
      if (mo[i] <= po || mt[i] <= pt) continue;
      flush(i, mo[i], mt[i]);
      out.push(b[i]);
      pb = i;
      po = mo[i];
      pt = mt[i];
    }
    flush(b.length, o.length, t.length);
    const trailing = ours.endsWith("\n") || theirs.endsWith("\n");
    return { text: out.join("\n") + (trailing && out.length ? "\n" : ""), conflict };
  }

  function initialState(files: Files, now: number): RepoState {
    const tree = { ...files };
    const user = { name: "ITCamp Student", email: "student@itclub.dev" };
    const c0: Commit = {
      id: "C0",
      sha: makeSha(`C0\n${JSON.stringify(tree)}`),
      message: "Initial commit",
      parents: [],
      branch: "main",
      time: now,
      author: `${user.name} <${user.email}>`,
      files: tree,
    };
    return {
      v: 1,
      head: "main",
      detached: null,
      branches: { main: "C0" },
      remote: { main: "C0" },
      commits: { C0: c0 },
      order: ["C0"],
      index: { ...tree },
      merging: null,
      next: 1,
      remoteUrl: REMOTE_URL,
      user,
    };
  }

  function headId(s: RepoState) {
    return s.detached ?? s.branches[s.head] ?? null;
  }

  function treeOf(s: RepoState, id: string | null): Files {
    return id && s.commits[id] ? s.commits[id].files : {};
  }

  function readWork(io: GitIo) {
    const files: Files = {};
    for (const path of io.list()) {
      const content = io.read(path);
      if (content !== null) files[path] = content;
    }
    return files;
  }

  function status(s: RepoState, work: Files): RepoStatus {
    const head = treeOf(s, headId(s));
    const idx = s.index;
    const conflicted = s.merging ? s.merging.unresolved.slice() : [];
    const staged: FileChange[] = [];
    const unstaged: FileChange[] = [];
    const untracked: string[] = [];
    for (const path of sortedKeys(head, idx)) {
      if (conflicted.includes(path)) continue;
      if (!(path in idx)) staged.push({ path, kind: "D" });
      else if (!(path in head)) staged.push({ path, kind: "A" });
      else if (idx[path] !== head[path]) staged.push({ path, kind: "M" });
    }
    for (const path of Object.keys(idx).sort()) {
      if (conflicted.includes(path)) continue;
      if (!(path in work)) unstaged.push({ path, kind: "D" });
      else if (work[path] !== idx[path]) unstaged.push({ path, kind: "M" });
    }
    for (const path of Object.keys(work).sort()) {
      if (!(path in idx) && !conflicted.includes(path)) untracked.push(path);
    }
    return { staged, unstaged, untracked, conflicted };
  }

  /** Every commit reachable from `id`, following all parents. */
  function reachable(s: RepoState, id: string | null | undefined) {
    const seen = new Set<string>();
    const stack = id ? [id] : [];
    while (stack.length) {
      const current = stack.pop()!;
      if (seen.has(current) || !s.commits[current]) continue;
      seen.add(current);
      stack.push(...s.commits[current].parents);
    }
    return seen;
  }

  /** Commits on `local` that `remote` does not have yet, oldest first. */
  function missing(s: RepoState, local: string | null | undefined, remote: string | null | undefined) {
    const have = reachable(s, remote);
    const want = reachable(s, local);
    return s.order.filter((id) => want.has(id) && !have.has(id));
  }

  function unpushedCount(s: RepoState) {
    const remoteHave = new Set<string>();
    for (const id of Object.values(s.remote)) for (const c of reachable(s, id)) remoteHave.add(c);
    const local = new Set<string>();
    for (const id of Object.values(s.branches)) for (const c of reachable(s, id)) local.add(c);
    let n = 0;
    for (const id of local) if (!remoteHave.has(id)) n++;
    return n;
  }

  function mergeBase(s: RepoState, a: string, b: string) {
    const fromA = reachable(s, a);
    const fromB = reachable(s, b);
    for (let i = s.order.length - 1; i >= 0; i--) {
      const id = s.order[i];
      if (fromA.has(id) && fromB.has(id)) return id;
    }
    return null;
  }

  function resolveRev(s: RepoState, rev: string): string | null {
    const m = /^(.*?)((?:[~^]\d*)*)$/.exec(rev);
    if (!m) return null;
    const name = m[1];
    let id: string | null = null;
    if (name === "HEAD" || name === "@") id = headId(s);
    else if (s.branches[name]) id = s.branches[name];
    else if (name.startsWith("origin/") && s.remote[name.slice(7)]) id = s.remote[name.slice(7)];
    else if (/^c\d+$/i.test(name) && s.commits[name.toUpperCase()]) id = name.toUpperCase();
    else if (/^[0-9a-f]{4,40}$/i.test(name)) {
      const found = s.order.filter((c) => s.commits[c].sha.startsWith(name.toLowerCase()));
      if (found.length === 1) id = found[0];
    }
    if (!id) return null;
    const suffix = m[2];
    const steps = suffix.match(/[~^]\d*/g) || [];
    for (const step of steps) {
      const count = step.length > 1 ? Number(step.slice(1)) : 1;
      if (step[0] === "^") {
        id = s.commits[id!]?.parents[count - 1] ?? null;
      } else {
        for (let i = 0; i < count && id; i++) id = s.commits[id]?.parents[0] ?? null;
      }
      if (!id) return null;
    }
    return id;
  }

  function short(s: RepoState, id: string) {
    return s.commits[id].sha.slice(0, 7);
  }

  function decorations(s: RepoState, id: string) {
    const parts: string[] = [];
    const head = headId(s);
    if (s.detached && head === id) parts.push(`${BOLD}${CYAN}HEAD${RESET}`);
    for (const [name, tip] of Object.entries(s.branches)) {
      if (tip !== id) continue;
      if (!s.detached && s.head === name) parts.unshift(`${BOLD}${CYAN}HEAD -> ${GREEN}${name}${RESET}`);
      else parts.push(`${BOLD}${GREEN}${name}${RESET}`);
    }
    for (const [name, tip] of Object.entries(s.remote)) {
      if (tip === id) parts.push(`${BOLD}${RED}origin/${name}${RESET}`);
    }
    return parts.length ? ` ${YELLOW}(${RESET}${parts.join(`${YELLOW}, ${RESET}`)}${YELLOW})${RESET}` : "";
  }

  function formatDate(time: number) {
    return new Date(time).toString().replace(/ \(.*\)$/, "");
  }

  function validBranchName(name: string) {
    return /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(name) && !name.endsWith("/") && !name.includes("..") && name !== "HEAD";
  }

  /** Paths whose local edits a move from `from` to `to` would overwrite. */
  function blockedPaths(s: RepoState, work: Files, from: Files, to: Files) {
    const blocked: string[] = [];
    for (const path of sortedKeys(from, to)) {
      if (from[path] === to[path]) continue;
      if (work[path] !== from[path] || s.index[path] !== from[path]) {
        if (work[path] === to[path] && s.index[path] === to[path]) continue;
        blocked.push(path);
      }
    }
    return blocked;
  }

  /** Rewrites the working directory and index from one snapshot to another, keeping unrelated edits. */
  function moveTree(s: RepoState, io: GitIo, from: Files, to: Files) {
    for (const path of sortedKeys(from, to)) {
      if (from[path] === to[path]) continue;
      if (path in to) {
        io.write(path, to[path]);
        s.index[path] = to[path];
      } else {
        io.remove(path);
        delete s.index[path];
      }
    }
  }

  const HELP = [
    `${BOLD}usage:${RESET} git <command> [<args>]`,
    "",
    `${CYAN}Start a working area${RESET}`,
    "   status     Show the working tree status",
    "   add        Add file contents to the staging area (index)",
    "   restore    Restore working tree files, or unstage with --staged",
    "   reset      Unstage files, or move the branch with --hard <commit>",
    "",
    `${CYAN}Grow, mark and tweak your history${RESET}`,
    "   commit     Record a snapshot:  git commit -m \"message\"",
    "   branch     List, create (git branch feat-ui) or delete (-d) branches",
    "   checkout   Switch branches (-b creates one), or restore a file",
    "   switch     Switch branches (-c creates one)",
    "   merge      Join another branch into the current one",
    "",
    `${CYAN}Look around${RESET}`,
    "   log        Show commit history (--oneline, --all)",
    "   diff       Show changes (--staged for the index)",
    "   show       Show one commit and its changes",
    "",
    `${CYAN}Collaborate (origin = GitHub)${RESET}`,
    "   push       Upload your commits:  git push origin main",
    "   pull       Fetch and merge from origin",
    "   remote     Show the remote:  git remote -v",
    "",
  ].join("\n");

  function run(argv: string[], input: RepoState, io: GitIo): GitResult {
    const s = clone(input);
    const out: string[] = [];
    let code = 0;
    let changed = false;
    const print = (text = "") => out.push(text);
    const fail = (text: string, exit = 1) => {
      print(text);
      code = exit;
    };
    const done = (): GitResult => ({
      state: changed ? s : input,
      out: out.length ? `${out.join("\n")}\n` : "",
      code,
      changed,
    });

    const [command, ...args] = argv;
    const flags = new Set(args.filter((a) => a.startsWith("-")));
    const positional = args.filter((a) => !a.startsWith("-"));

    switch (command) {
      case undefined:
      case "help":
      case "--help":
      case "-h":
        print(HELP);
        return done();

      case "--version":
      case "version":
        print("git version 2.47.0 (itcamp studio edition)");
        return done();

      case "init":
        print("Reinitialized existing Git repository in .git/");
        return done();

      case "clone":
        fail(`fatal: this sandbox is already a clone of ${s.remoteUrl}`, 128);
        return done();

      case "config": {
        const key = positional[0];
        if (flags.has("--list") || flags.has("-l")) {
          print(`user.name=${s.user.name}`);
          print(`user.email=${s.user.email}`);
          print(`remote.origin.url=${s.remoteUrl}`);
          return done();
        }
        if (key !== "user.name" && key !== "user.email") {
          fail("This sandbox only stores user.name and user.email.");
          return done();
        }
        const field = key === "user.name" ? "name" : "email";
        const value = positional.slice(1).join(" ");
        if (!value) print(s.user[field]);
        else {
          s.user[field] = value;
          changed = true;
        }
        return done();
      }

      case "status": {
        const work = readWork(io);
        const st = status(s, work);
        if (flags.has("-s") || flags.has("--short")) {
          const rows = new Map<string, [string, string]>();
          for (const c of st.staged) rows.set(c.path, [c.kind, " "]);
          for (const c of st.unstaged) rows.set(c.path, [rows.get(c.path)?.[0] ?? " ", c.kind]);
          for (const path of Array.from(rows.keys()).sort()) {
            const [x, y] = rows.get(path)!;
            print(`${GREEN}${x}${RED}${y}${RESET} ${path}`);
          }
          for (const path of st.conflicted) print(`${RED}UU${RESET} ${path}`);
          for (const path of st.untracked) print(`${RED}??${RESET} ${path}`);
          return done();
        }
        if (s.detached) print(`${RED}HEAD detached at ${short(s, s.detached)}${RESET}`);
        else {
          print(`On branch ${s.head}`);
          const remoteTip = s.remote[s.head];
          if (remoteTip) {
            const ahead = missing(s, s.branches[s.head], remoteTip).length;
            const behind = missing(s, remoteTip, s.branches[s.head]).length;
            if (ahead && behind) print(`Your branch and 'origin/${s.head}' have diverged.`);
            else if (ahead) {
              print(`Your branch is ahead of 'origin/${s.head}' by ${plural(ahead, "commit")}.`);
              print('  (use "git push" to publish your local commits)');
            } else if (behind) print(`Your branch is behind 'origin/${s.head}' by ${plural(behind, "commit")}.`);
            else print(`Your branch is up to date with 'origin/${s.head}'.`);
          }
        }
        print();
        if (st.conflicted.length) {
          print("You have unmerged paths.");
          print('  (fix conflicts and run "git commit")');
          print('  (use "git merge --abort" to abort the merge)');
          print();
          print("Unmerged paths:");
          print('  (use "git add <file>..." to mark resolution)');
          for (const path of st.conflicted) print(`\t${RED}both modified:   ${path}${RESET}`);
          print();
        }
        const label = { A: "new file:", M: "modified:", D: "deleted: " } as const;
        if (st.staged.length) {
          print("Changes to be committed:");
          print('  (use "git restore --staged <file>..." to unstage)');
          for (const c of st.staged) print(`\t${GREEN}${label[c.kind].padEnd(12)}${c.path}${RESET}`);
          print();
        }
        if (st.unstaged.length) {
          print("Changes not staged for commit:");
          print('  (use "git add <file>..." to update what will be committed)');
          print('  (use "git restore <file>..." to discard changes in working directory)');
          for (const c of st.unstaged) print(`\t${RED}${label[c.kind].padEnd(12)}${c.path}${RESET}`);
          print();
        }
        if (st.untracked.length) {
          print("Untracked files:");
          print('  (use "git add <file>..." to include in what will be committed)');
          for (const path of st.untracked) print(`\t${RED}${path}${RESET}`);
          print();
        }
        const dirty = st.staged.length + st.unstaged.length + st.untracked.length + st.conflicted.length;
        if (!dirty) print(s.merging ? 'All conflicts fixed but you are still merging.\n  (use "git commit" to conclude merge)' : "nothing to commit, working tree clean");
        else if (!st.staged.length && !st.conflicted.length) print('no changes added to commit (use "git add" and/or "git commit -a")');
        return done();
      }

      case "add": {
        const work = readWork(io);
        if (!positional.length && !flags.has("-A") && !flags.has("--all")) {
          print("Nothing specified, nothing added.");
          print(`${YELLOW}hint: Maybe you wanted to say 'git add .'?${RESET}`);
          return done();
        }
        const everything = flags.has("-A") || flags.has("--all") || positional.includes(".") || positional.includes("*");
        const targets = everything ? sortedKeys(work, s.index) : positional;
        for (const target of targets) {
          const clean = target.replace(/^\.\//, "").replace(/\/$/, "");
          const matches = sortedKeys(work, s.index).filter((p) => p === clean || p.startsWith(`${clean}/`));
          if (!matches.length) {
            fail(`fatal: pathspec '${target}' did not match any files`, 128);
            return done();
          }
          for (const path of matches) {
            if (path in work) s.index[path] = work[path];
            else delete s.index[path];
            if (s.merging) s.merging.unresolved = s.merging.unresolved.filter((p) => p !== path);
          }
        }
        changed = true;
        return done();
      }

      case "rm": {
        const cached = flags.has("--cached");
        for (const path of positional) {
          if (!(path in s.index)) {
            fail(`fatal: pathspec '${path}' did not match any files`, 128);
            return done();
          }
          delete s.index[path];
          if (!cached) io.remove(path);
          print(`rm '${path}'`);
        }
        changed = true;
        return done();
      }

      case "commit": {
        const messages: string[] = [];
        let all = false;
        for (let i = 0; i < args.length; i++) {
          const a = args[i];
          if (a === "-a" || a === "--all") all = true;
          else if (a === "-m" || a === "--message" || a === "-am") {
            if (a === "-am") all = true;
            const value = args[i + 1];
            if (value === undefined) {
              fail(`error: switch \`m' requires a value`, 129);
              return done();
            }
            messages.push(value);
            i++;
          } else if (a.startsWith("--message=")) messages.push(a.slice(10));
          else if (a.startsWith("-m") && a.length > 2) messages.push(a.slice(2));
        }
        const work = readWork(io);
        if (all) {
          for (const path of Object.keys(s.index)) {
            if (s.merging?.unresolved.includes(path)) continue;
            if (path in work) s.index[path] = work[path];
            else delete s.index[path];
          }
        }
        if (s.merging?.unresolved.length) {
          fail("error: Committing is not possible because you have unmerged files.");
          print(`${YELLOW}hint: Fix them up in the editor, then 'git add <file>' and 'git commit'.${RESET}`);
          print("fatal: Exiting because of an unresolved conflict.");
          return done();
        }
        const parent = headId(s);
        const before = treeOf(s, parent);
        if (!s.merging && sameTree(s.index, before)) {
          const st = status(s, work);
          if (s.detached) print(`HEAD detached at ${short(s, s.detached)}`);
          else print(`On branch ${s.head}`);
          if (st.unstaged.length || st.untracked.length) {
            print('no changes added to commit (use "git add" and/or "git commit -a")');
          } else print("nothing to commit, working tree clean");
          code = 1;
          return done();
        }
        let message = messages.join("\n\n").trim();
        if (!message && s.merging) message = `Merge branch '${s.merging.branch}'`;
        if (!message) {
          fail("Aborting commit: this sandbox has no text editor to write a message in.");
          print(`${YELLOW}hint: add the message inline:  git commit -m "feat: update portal UI"${RESET}`);
          return done();
        }
        const id = `C${s.next}`;
        s.next++;
        const parents = parent ? [parent] : [];
        if (s.merging) parents.push(s.merging.theirs);
        const time = io.now();
        const commit: Commit = {
          id,
          sha: makeSha(`${id}\n${message}\n${parents.join(",")}\n${time}\n${JSON.stringify(s.index)}`),
          message,
          parents,
          branch: s.detached ? "(detached)" : s.head,
          time,
          author: `${s.user.name} <${s.user.email}>`,
          files: { ...s.index },
        };
        s.commits[id] = commit;
        s.order.push(id);
        if (s.detached) s.detached = id;
        else s.branches[s.head] = id;
        s.merging = null;
        changed = true;
        const where = s.detached ? "detached HEAD" : s.head;
        const root = parents.length ? "" : " (root-commit)";
        print(`[${where}${root} ${commit.sha.slice(0, 7)}] ${message.split("\n")[0]}`);
        print(changeSummary(before, commit.files));
        print(`${DIM}  -> snapshot ${id} sealed in the vault (.git)${RESET}`);
        return done();
      }

      case "log": {
        const oneline = flags.has("--oneline");
        const all = flags.has("--all");
        const starts: string[] = [];
        if (all) {
          starts.push(...Object.values(s.branches), ...Object.values(s.remote));
          const head = headId(s);
          if (head) starts.push(head);
        } else if (positional[0]) {
          const id = resolveRev(s, positional[0]);
          if (!id) {
            fail(`fatal: ambiguous argument '${positional[0]}': unknown revision or path not in the working tree.`, 128);
            return done();
          }
          starts.push(id);
        } else {
          const head = headId(s);
          if (head) starts.push(head);
        }
        const show = new Set<string>();
        for (const start of starts) for (const id of reachable(s, start)) show.add(id);
        const list = s.order.filter((id) => show.has(id)).reverse();
        const limitFlag = args.find((a) => /^-\d+$/.test(a));
        const limit = limitFlag ? Number(limitFlag.slice(1)) : list.length;
        for (const id of list.slice(0, limit)) {
          const c = s.commits[id];
          if (oneline) {
            print(`${YELLOW}${c.sha.slice(0, 7)}${RESET}${decorations(s, id)} ${c.message.split("\n")[0]} ${DIM}[${id}]${RESET}`);
            continue;
          }
          print(`${YELLOW}commit ${c.sha}${RESET}${decorations(s, id)} ${DIM}[${id}]${RESET}`);
          if (c.parents.length > 1) print(`Merge: ${c.parents.map((p) => short(s, p)).join(" ")}`);
          print(`Author: ${c.author}`);
          print(`Date:   ${formatDate(c.time)}`);
          print();
          for (const line of c.message.split("\n")) print(`    ${line}`);
          print();
        }
        return done();
      }

      case "show": {
        const id = resolveRev(s, positional[0] ?? "HEAD");
        if (!id) {
          fail(`fatal: ambiguous argument '${positional[0]}': unknown revision`, 128);
          return done();
        }
        const c = s.commits[id];
        print(`${YELLOW}commit ${c.sha}${RESET}${decorations(s, id)} ${DIM}[${id}]${RESET}`);
        print(`Author: ${c.author}`);
        print(`Date:   ${formatDate(c.time)}`);
        print();
        for (const line of c.message.split("\n")) print(`    ${line}`);
        print();
        const parentTree = treeOf(s, c.parents[0] ?? null);
        for (const path of sortedKeys(parentTree, c.files)) {
          if (parentTree[path] !== c.files[path]) print(unifiedDiff(path, parentTree[path], c.files[path]));
        }
        return done();
      }

      case "diff": {
        const staged = flags.has("--staged") || flags.has("--cached");
        const work = readWork(io);
        const from = staged ? treeOf(s, headId(s)) : s.index;
        const to = staged ? s.index : work;
        // Unstaged diffs only cover tracked files, like real Git; untracked files never show.
        const paths = staged ? sortedKeys(from, to) : Object.keys(s.index).sort();
        const only = positional.length ? new Set(positional) : null;
        const shown: string[] = [];
        for (const path of paths) {
          if (only && !only.has(path)) continue;
          if (from[path] === to[path]) continue;
          shown.push(unifiedDiff(path, from[path], to[path]));
        }
        if (shown.length) print(shown.join("\n"));
        return done();
      }

      case "restore": {
        const staged = flags.has("--staged") || flags.has("-S");
        if (!positional.length) {
          fail("fatal: you must specify path(s) to restore", 128);
          return done();
        }
        const head = treeOf(s, headId(s));
        const everything = positional.includes(".");
        const targets = everything ? sortedKeys(s.index, head, staged ? {} : readWork(io)) : positional;
        for (const path of targets) {
          if (staged) {
            if (path in head) s.index[path] = head[path];
            else if (path in s.index) delete s.index[path];
            else if (!everything) {
              fail(`error: pathspec '${path}' did not match any file(s) known to git`);
              return done();
            }
          } else if (path in s.index) io.write(path, s.index[path]);
          else if (!everything) {
            fail(`error: pathspec '${path}' did not match any file(s) known to git`);
            return done();
          }
        }
        changed = true;
        return done();
      }

      case "reset": {
        const hard = flags.has("--hard");
        const target = positional.find((p) => resolveRev(s, p));
        const paths = positional.filter((p) => p !== target);
        const head = treeOf(s, headId(s));
        if (paths.length && !hard) {
          for (const path of paths) {
            if (path in head) s.index[path] = head[path];
            else delete s.index[path];
          }
          print("Unstaged changes after reset:");
          changed = true;
          return done();
        }
        const id = target ? resolveRev(s, target)! : headId(s);
        if (!id) return done();
        const tree = treeOf(s, id);
        if (hard) {
          const work = readWork(io);
          for (const path of sortedKeys(head, tree, s.index)) {
            if (path in tree) {
              if (work[path] !== tree[path]) io.write(path, tree[path]);
            } else if (path in head || path in s.index) io.remove(path);
          }
          s.index = { ...tree };
          s.merging = null;
        } else {
          s.index = { ...tree };
        }
        if (s.detached) s.detached = id;
        else s.branches[s.head] = id;
        changed = true;
        if (hard) print(`HEAD is now at ${short(s, id)} ${s.commits[id].message.split("\n")[0]}`);
        return done();
      }

      case "branch": {
        if (flags.has("-d") || flags.has("-D") || flags.has("--delete")) {
          const force = flags.has("-D");
          for (const name of positional) {
            const tip = s.branches[name];
            if (!tip) {
              fail(`error: branch '${name}' not found.`);
              return done();
            }
            if (!s.detached && s.head === name) {
              fail(`error: Cannot delete branch '${name}' checked out at '/home/portal'`);
              return done();
            }
            if (!force && !reachable(s, headId(s)).has(tip)) {
              fail(`error: The branch '${name}' is not fully merged.`);
              print(`${YELLOW}hint: If you are sure you want to delete it, run 'git branch -D ${name}'${RESET}`);
              return done();
            }
            delete s.branches[name];
            changed = true;
            print(`Deleted branch ${name} (was ${short(s, tip)}).`);
          }
          return done();
        }
        if (flags.has("-m") || flags.has("-M")) {
          const [a, b] = positional;
          const from = b ? a : s.head;
          const to = b ?? a;
          if (!to || !s.branches[from]) {
            fail("fatal: branch rename needs a new name");
            return done();
          }
          if (!validBranchName(to)) {
            fail(`fatal: '${to}' is not a valid branch name`, 128);
            return done();
          }
          s.branches[to] = s.branches[from];
          delete s.branches[from];
          if (s.head === from) s.head = to;
          changed = true;
          return done();
        }
        if (positional.length) {
          const [name, start] = positional;
          if (!validBranchName(name)) {
            fail(`fatal: '${name}' is not a valid branch name`, 128);
            return done();
          }
          if (s.branches[name]) {
            fail(`fatal: a branch named '${name}' already exists`, 128);
            return done();
          }
          const at = start ? resolveRev(s, start) : headId(s);
          if (!at) {
            fail(`fatal: not a valid object name: '${start}'`, 128);
            return done();
          }
          s.branches[name] = at;
          changed = true;
          return done();
        }
        if (s.detached) print(`* ${GREEN}(HEAD detached at ${short(s, s.detached)})${RESET}`);
        for (const name of Object.keys(s.branches).sort()) {
          if (!s.detached && name === s.head) print(`* ${GREEN}${name}${RESET}`);
          else print(`  ${name}`);
        }
        if (flags.has("-a") || flags.has("-r")) {
          for (const name of Object.keys(s.remote).sort()) print(`  ${RED}remotes/origin/${name}${RESET}`);
        }
        return done();
      }

      case "checkout":
      case "switch": {
        if (s.merging) {
          fail("error: you need to resolve your current index first");
          return done();
        }
        const create = flags.has("-b") || flags.has("-B") || flags.has("-c") || flags.has("-C");
        const dashDash = args.indexOf("--");
        if (command === "checkout" && dashDash !== -1) {
          for (const path of args.slice(dashDash + 1)) {
            if (path in s.index) io.write(path, s.index[path]);
            else {
              fail(`error: pathspec '${path}' did not match any file(s) known to git`);
              return done();
            }
          }
          return done();
        }
        const name = positional[0];
        if (!name) {
          fail(command === "switch" ? "fatal: missing branch or commit argument" : "fatal: you must name a branch to check out", 128);
          return done();
        }
        const work = readWork(io);
        const fromTree = treeOf(s, headId(s));
        if (create) {
          if (!validBranchName(name)) {
            fail(`fatal: '${name}' is not a valid branch name`, 128);
            return done();
          }
          if (s.branches[name] && !flags.has("-B") && !flags.has("-C")) {
            fail(`fatal: a branch named '${name}' already exists`, 128);
            return done();
          }
          const at = positional[1] ? resolveRev(s, positional[1]) : headId(s);
          if (!at) {
            fail(`fatal: '${positional[1]}' is not a commit`, 128);
            return done();
          }
          const toTree = treeOf(s, at);
          const blocked = blockedPaths(s, work, fromTree, toTree);
          if (blocked.length) {
            fail(`error: Your local changes to the following files would be overwritten by checkout:\n${blocked.map((p) => `\t${p}`).join("\n")}\nPlease commit your changes or stash them before you switch branches.\nAborting`);
            return done();
          }
          moveTree(s, io, fromTree, toTree);
          s.branches[name] = at;
          s.head = name;
          s.detached = null;
          changed = true;
          print(`Switched to a new branch '${name}'`);
          return done();
        }
        let branch = s.branches[name] ? name : null;
        let target = branch ? s.branches[name] : null;
        let tracking = false;
        if (!branch && s.remote[name]) {
          branch = name;
          target = s.remote[name];
          tracking = true;
        }
        if (!branch && command === "checkout" && name in s.index && !resolveRev(s, name)) {
          io.write(name, s.index[name]);
          print(`Updated 1 path from the index`);
          return done();
        }
        if (!branch) {
          const id = resolveRev(s, name);
          if (!id || (command === "switch" && !flags.has("--detach"))) {
            fail(
              command === "switch" && id
                ? `fatal: a branch is expected, got commit '${name}'\nhint: use 'git switch --detach ${name}' to look around`
                : `error: pathspec '${name}' did not match any file(s) known to git`,
            );
            return done();
          }
          const toTree = treeOf(s, id);
          const blocked = blockedPaths(s, work, fromTree, toTree);
          if (blocked.length) {
            fail(`error: Your local changes to the following files would be overwritten by checkout:\n${blocked.map((p) => `\t${p}`).join("\n")}\nAborting`);
            return done();
          }
          moveTree(s, io, fromTree, toTree);
          s.detached = id;
          s.head = "";
          changed = true;
          print(`Note: switching to '${name}'.`);
          print();
          print("You are in 'detached HEAD' state. You can look around and make experimental");
          print("changes. Switch back with:  git switch main");
          print();
          print(`HEAD is now at ${short(s, id)} ${s.commits[id].message.split("\n")[0]}`);
          return done();
        }
        if (!s.detached && s.head === branch) {
          print(`Already on '${branch}'`);
          return done();
        }
        const toTree = treeOf(s, target);
        const blocked = blockedPaths(s, work, fromTree, toTree);
        if (blocked.length) {
          fail(`error: Your local changes to the following files would be overwritten by checkout:\n${blocked.map((p) => `\t${p}`).join("\n")}\nPlease commit your changes or stash them before you switch branches.\nAborting`);
          return done();
        }
        moveTree(s, io, fromTree, toTree);
        if (tracking) s.branches[branch] = target!;
        s.head = branch;
        s.detached = null;
        changed = true;
        const st = status(s, readWork(io));
        for (const c of st.unstaged) print(`${c.kind}\t${c.path}`);
        if (tracking) print(`branch '${branch}' set up to track 'origin/${branch}'.`);
        print(`Switched to ${tracking ? "a new " : ""}branch '${branch}'`);
        return done();
      }

      case "merge": {
        if (flags.has("--abort")) {
          if (!s.merging) {
            fail("fatal: There is no merge to abort (MERGE_HEAD missing).", 128);
            return done();
          }
          const tree = treeOf(s, headId(s));
          const work = readWork(io);
          for (const path of sortedKeys(tree, work, s.index)) {
            if (path in tree) {
              if (work[path] !== tree[path]) io.write(path, tree[path]);
            } else if (path in s.index) io.remove(path);
          }
          s.index = { ...tree };
          s.merging = null;
          changed = true;
          return done();
        }
        if (s.merging) {
          fail("error: Merging is not possible because you have unmerged files.");
          return done();
        }
        const name = positional[0];
        if (!name) {
          fail("fatal: No remote for the current branch.", 128);
          return done();
        }
        const theirs = resolveRev(s, name);
        const ours = headId(s);
        if (!theirs || !ours) {
          fail(`merge: ${name} - not something we can merge`);
          return done();
        }
        return mergeInto(name, theirs, ours);
      }

      case "pull": {
        if (s.detached) {
          fail("You are not currently on a branch.");
          return done();
        }
        const branch = positional[1] ?? s.head;
        const theirs = s.remote[branch];
        print(`From ${s.remoteUrl.replace(/\.git$/, "")}`);
        if (!theirs) {
          fail(`fatal: couldn't find remote ref ${branch}`, 128);
          return done();
        }
        print(` * branch            ${branch}       -> FETCH_HEAD`);
        return mergeInto(`origin/${branch}`, theirs, headId(s)!);
      }

      case "fetch":
        return done();

      case "remote":
        if (flags.has("-v") || flags.has("--verbose")) {
          print(`origin\t${s.remoteUrl} (fetch)`);
          print(`origin\t${s.remoteUrl} (push)`);
        } else if (positional[0] === "add") {
          fail("error: remote origin already exists.", 3);
        } else print("origin");
        return done();

      case "push": {
        const force = flags.has("-f") || flags.has("--force");
        const [remoteName, refspec] = positional;
        if (remoteName && remoteName !== "origin") {
          fail(`fatal: '${remoteName}' does not appear to be a git repository\nfatal: Could not read from remote repository.`, 128);
          return done();
        }
        const branch = (refspec ?? (s.detached ? "" : s.head)).split(":")[0];
        if (!branch) {
          fail("fatal: You are not currently on a branch.", 128);
          return done();
        }
        const local = s.branches[branch];
        if (!local) {
          fail(`error: src refspec ${branch} does not match any\nerror: failed to push some refs to '${s.remoteUrl}'`, 1);
          return done();
        }
        const before = s.remote[branch] ?? null;
        if (before === local) {
          print("Everything up-to-date");
          return done();
        }
        if (before && !reachable(s, local).has(before) && !force) {
          print(`To ${s.remoteUrl}`);
          print(` ${RED}! [rejected]${RESET}        ${branch} -> ${branch} (non-fast-forward)`);
          fail(`error: failed to push some refs to '${s.remoteUrl}'\n${YELLOW}hint: Updates were rejected because the tip of your current branch is behind\nhint: its remote counterpart. Use 'git pull' before pushing again.${RESET}`);
          return done();
        }
        // Only what GitHub lacks on any branch travels; a new branch of old commits sends nothing.
        const have = new Set<string>();
        for (const tip of Object.values(s.remote)) for (const id of reachable(s, tip)) have.add(id);
        const want = reachable(s, local);
        const sending = s.order.filter((id) => want.has(id) && !have.has(id));
        const objects = sending.reduce((n, id) => n + 2 + countChanges(treeOf(s, s.commits[id].parents[0] ?? null), s.commits[id].files).files, 0);
        const bytes = sending.reduce((n, id) => n + JSON.stringify(s.commits[id].files).length, 0);
        if (sending.length) {
          const compressed = Math.max(1, objects - sending.length);
          print(`Enumerating objects: ${objects + 3}, done.`);
          print(`Counting objects: 100% (${objects + 3}/${objects + 3}), done.`);
          print("Delta compression using up to 8 threads");
          print(`Compressing objects: 100% (${compressed}/${compressed}), done.`);
          print(`Writing objects: 100% (${objects}/${objects}), ${(bytes / 1024).toFixed(2)} KiB | 1.21 MiB/s, done.`);
          print(`Total ${objects} (delta ${Math.max(0, objects - 2)}), reused 0 (delta 0), pack-reused 0`);
        } else {
          print("Total 0 (delta 0), reused 0 (delta 0), pack-reused 0");
        }
        if (!before) {
          print(`remote:`);
          print(`remote: Create a pull request for '${branch}' on GitHub by visiting:`);
          print(`remote:      ${s.remoteUrl.replace(/\.git$/, "")}/pull/new/${branch}`);
          print(`remote:`);
        }
        print(`To ${s.remoteUrl}`);
        if (!before) print(` * [new branch]      ${branch} -> ${branch}`);
        else print(`   ${short(s, before)}${force && !reachable(s, local).has(before) ? "..." : ".."}${short(s, local)}  ${branch} -> ${branch}${force ? " (forced update)" : ""}`);
        if (!before || flags.has("-u") || flags.has("--set-upstream")) print(`branch '${branch}' set up to track 'origin/${branch}'.`);
        print(
          sending.length
            ? `${DIM}  -> sent ${sending.join(", ")} to GitHub${RESET}`
            : `${DIM}  -> GitHub already had every commit; only the branch pointer moved${RESET}`,
        );
        s.remote[branch] = local;
        changed = true;
        return done();
      }

      default:
        fail(`git: '${command}' is not a git command. See 'git help'.`);
        return done();
    }

    function mergeInto(name: string, theirs: string, ours: string): GitResult {
      const work = readWork(io);
      if (reachable(s, ours).has(theirs)) {
        print("Already up to date.");
        return done();
      }
      const oursTree = treeOf(s, ours);
      const theirsTree = treeOf(s, theirs);
      if (reachable(s, theirs).has(ours)) {
        const blocked = blockedPaths(s, work, oursTree, theirsTree);
        if (blocked.length) {
          fail(`error: Your local changes to the following files would be overwritten by merge:\n${blocked.map((p) => `\t${p}`).join("\n")}\nPlease commit your changes or stash them before you merge.\nAborting`);
          return done();
        }
        moveTree(s, io, oursTree, theirsTree);
        if (s.detached) s.detached = theirs;
        else s.branches[s.head] = theirs;
        changed = true;
        print(`Updating ${short(s, ours)}..${short(s, theirs)}`);
        print("Fast-forward");
        print(changeSummary(oursTree, theirsTree));
        return done();
      }
      const baseTree = treeOf(s, mergeBase(s, ours, theirs));
      const result: Files = {};
      const conflicts: string[] = [];
      for (const path of sortedKeys(baseTree, oursTree, theirsTree)) {
        const b = baseTree[path];
        const o = oursTree[path];
        const t = theirsTree[path];
        if (o === t) {
          if (o !== undefined) result[path] = o;
        } else if (b === o) {
          if (t !== undefined) result[path] = t;
        } else if (b === t) {
          if (o !== undefined) result[path] = o;
        } else if (o === undefined || t === undefined) {
          result[path] = (o ?? t)!;
          conflicts.push(path);
        } else {
          const merged = mergeText(b ?? "", o, t, name);
          result[path] = merged.text;
          if (merged.conflict) conflicts.push(path);
        }
      }
      const blocked = blockedPaths(s, work, oursTree, result);
      if (blocked.length) {
        fail(`error: Your local changes to the following files would be overwritten by merge:\n${blocked.map((p) => `\t${p}`).join("\n")}\nPlease commit your changes or stash them before you merge.\nAborting`);
        return done();
      }
      for (const path of sortedKeys(oursTree, result)) {
        if (oursTree[path] === result[path]) continue;
        if (path in result) io.write(path, result[path]);
        else io.remove(path);
        if (!conflicts.includes(path)) {
          if (path in result) s.index[path] = result[path];
          else delete s.index[path];
        }
      }
      changed = true;
      const branchLabel = name.startsWith("origin/") ? `remote-tracking branch '${name}'` : `branch '${name}'`;
      if (conflicts.length) {
        for (const path of conflicts) {
          print(`Auto-merging ${path}`);
          print(`${RED}CONFLICT (content): Merge conflict in ${path}${RESET}`);
        }
        fail("Automatic merge failed; fix conflicts and then commit the result.");
        s.merging = { theirs, branch: name, unresolved: conflicts };
        return done();
      }
      const id = `C${s.next}`;
      s.next++;
      const time = io.now();
      const message = `Merge ${branchLabel}`;
      s.commits[id] = {
        id,
        sha: makeSha(`${id}\n${message}\n${ours},${theirs}\n${time}\n${JSON.stringify(s.index)}`),
        message,
        parents: [ours, theirs],
        branch: s.detached ? "(detached)" : s.head,
        time,
        author: `${s.user.name} <${s.user.email}>`,
        files: { ...s.index },
      };
      s.order.push(id);
      if (s.detached) s.detached = id;
      else s.branches[s.head] = id;
      print("Merge made by the 'ort' strategy.");
      print(changeSummary(oursTree, s.index));
      print(`${DIM}  -> merge commit ${id} joins ${ours} and ${theirs}${RESET}`);
      return done();
    }
  }

  /** Splits a command line the way a shell would, honouring single and double quotes. */
  function splitArgs(line: string) {
    const args: string[] = [];
    let current = "";
    let quote: string | null = null;
    let has = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quote) {
        if (ch === quote) quote = null;
        else if (ch === "\\" && quote === '"' && i + 1 < line.length) current += line[++i];
        else current += ch;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
        has = true;
      } else if (/\s/.test(ch)) {
        if (has || current) args.push(current);
        current = "";
        has = false;
      } else if (ch === "\\" && i + 1 < line.length) {
        current += line[++i];
      } else current += ch;
    }
    if (has || current) args.push(current);
    return args;
  }

  return {
    run,
    status,
    initialState,
    headId,
    treeOf,
    reachable,
    missing,
    unpushedCount,
    splitArgs,
    colors: { RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN, DIM, BOLD, RESET },
  };
}
