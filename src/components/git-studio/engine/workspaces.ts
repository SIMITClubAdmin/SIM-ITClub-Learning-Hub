import { createMiniGit, type Files, type GitIo, type RepoState } from "./mini-git";
import { STARTER_FILES } from "./sandbox-files";

const engine = createMiniGit();

export type StudioVariant = "portal" | "activity1" | "activity2" | "game1" | "game2" | "game3" | "game4" | "advanced";

/** What the sandbox holds when a studio starts or resets. Paths are relative to the workspace. */
export type Workspace = {
  /** Folder the terminal opens in ("" is the workspace itself). */
  startDir: string;
  /** Whether `npm run dev` and the live preview make sense here. */
  allowDev: boolean;
  /** Files kept out of the editor tabs (still in the sandbox). */
  hidden: string[];
  files: Files;
};

/** An in-memory folder that the engine can run against, for building starting states. */
export class MemFolder implements GitIo {
  files: Files;
  private clock: number;
  constructor(files: Files = {}, start = Date.now()) {
    this.files = { ...files };
    this.clock = start;
  }
  list() {
    return Object.keys(this.files);
  }
  read(path: string) {
    return this.files[path] ?? null;
  }
  write(path: string, content: string) {
    this.files[path] = content;
  }
  remove(path: string) {
    delete this.files[path];
  }
  now() {
    this.clock += 7 * 60_000;
    return this.clock;
  }
}

type Step = { write?: Files; git?: string[] };

/** Builds a repository by really running Git commands, so its history is genuine. */
function scripted(steps: Step[], start: number, state: RepoState = engine.emptyState()) {
  const folder = new MemFolder({}, start);
  let s = state;
  for (const step of steps) {
    if (step.write) for (const [p, c] of Object.entries(step.write)) folder.write(p, c);
    if (step.git) s = engine.run(step.git, s, folder).state;
  }
  return { state: s, files: folder.files };
}

function inFolder(dir: string, files: Files, state: RepoState): Files {
  const out: Files = {};
  for (const [p, c] of Object.entries(files)) out[`${dir}/${p}`] = c;
  out[`${dir}/.git/studio.json`] = JSON.stringify(state);
  return out;
}

const PART1 = "Hello my name is Michelle.\n";
const GAME_BASE: Step[] = [
  { write: { "part1.txt": PART1 }, git: ["add", "."] },
  { git: ["commit", "-m", "Initial commit"] },
  { write: { "part1.txt": `${PART1}Welcome to ITCamp!\n` }, git: ["commit", "-am", "Add welcome line"] },
];
const GAME_BLUE: Step[] = [
  { git: ["switch", "-c", "blue"] },
  { write: { "blue.txt": "The blue team was here.\n" }, git: ["add", "."] },
  { git: ["commit", "-m", "Add blue.txt"] },
  { git: ["switch", "main"] },
];
const GAME_RED: Step[] = [
  { git: ["merge", "blue"] },
  { git: ["switch", "-c", "red", "C1"] },
  { write: { "red.txt": "The red team was here.\n" }, git: ["add", "."] },
  { git: ["commit", "-m", "Add red.txt"] },
  { git: ["switch", "main"] },
];

const ACTIVITY1_KEY = "gs-activity1-intro";

/** The your-name.txt a student committed in Activity 1, if this browser has it. */
export function activity1Intro(): string | null {
  try {
    const text = localStorage.getItem(ACTIVITY1_KEY);
    return text && text.trim() ? text : null;
  } catch {
    return null;
  }
}

export function rememberActivity1Intro(text: string) {
  try {
    if (text.trim()) localStorage.setItem(ACTIVITY1_KEY, text.endsWith("\n") ? text : `${text}\n`);
  } catch {
    // Storage can be blocked; Activity 2 then starts from a sample introduction.
  }
}

export function buildWorkspace(variant: StudioVariant, now = Date.now()): Workspace {
  const start = now - 3 * 3600_000;
  switch (variant) {
    case "portal":
      return {
        startDir: "portal",
        allowDev: true,
        hidden: ["server.js"],
        files: inFolder("portal", STARTER_FILES, engine.initialState(STARTER_FILES, now)),
      };
    case "activity1":
    case "game4":
      return { startDir: "", allowDev: false, hidden: [], files: {} };
    case "activity2": {
      // Picks up where Activity 1 left off: the student's own introduction if they wrote one.
      const intro = activity1Intro() ?? "Hi! I'm an ITCamp student and I'm learning Git.\n";
      const repo = scripted([{ write: { "your-name.txt": intro }, git: ["add", "."] }, { git: ["commit", "-m", "Initial commit"] }], start);
      return { startDir: "my-project", allowDev: false, hidden: [], files: inFolder("my-project", repo.files, repo.state) };
    }
    case "game1":
    case "game2":
    case "game3": {
      const steps = variant === "game1" ? GAME_BASE : variant === "game2" ? [...GAME_BASE, ...GAME_BLUE] : [...GAME_BASE, ...GAME_BLUE, ...GAME_RED];
      const repo = scripted(steps, start);
      return { startDir: "game", allowDev: false, hidden: [], files: inFolder("game", repo.files, repo.state) };
    }
    case "advanced": {
      const repo = scripted(
        [
          // A typo on line 1 that the feature branch fixes, and a main-only change on line 3,
          // so cherry-pick (C3), revert (C1) and rebase all apply cleanly.
          { write: { "notes.md": "# Club ntoes\n\n- Meeting on Monday\n" }, git: ["add", "."] },
          { git: ["commit", "-m", "Initial commit"] },
          { write: { "agenda.md": "# Agenda\n\n1. Welcome\n2. Git workshop\n" }, git: ["add", "."] },
          { git: ["commit", "-m", "Add agenda"] },
          { git: ["switch", "-c", "feature"] },
          { write: { "search.md": "# Search\n\nFind members by name.\n" }, git: ["add", "."] },
          { git: ["commit", "-m", "Add search page"] },
          { write: { "notes.md": "# Club notes\n\n- Meeting on Monday\n" }, git: ["commit", "-am", "Fix typo in notes title"] },
          { git: ["switch", "main"] },
          { write: { "notes.md": "# Club ntoes\n\n- Meeting on Tuesday\n" }, git: ["commit", "-am", "Move meeting to Tuesday"] },
        ],
        start,
      );
      return { startDir: "advanced", allowDev: false, hidden: [], files: inFolder("advanced", repo.files, repo.state) };
    }
  }
}

// ---------- git clone ----------

type CloneCommit = { message: string; files: Files; author?: string; time?: number; sha?: string };

const CLUB_PAGE = (extra: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>SIM ITClub</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
${extra}  <h1>SIM ITClub</h1>
  <p>Workshops, hackathons and friends who build things.</p>
</body>
</html>
`;

/** Copies of the repositories used in the Lesson 2 slides, so cloning them works instantly and offline. */
const WORKSHOP_REPOS: Record<string, { name: string; history: CloneCommit[] }> = {
  "simitclubadmin/itclub_website": {
    name: "ITClub_website",
    history: [
      { message: "Create homepage", files: { "README.md": "# ITClub_website\n\nThe SIM ITClub homepage (workshop copy).\n", "index.html": CLUB_PAGE("") } },
      {
        message: "Add navbar",
        files: {
          "README.md": "# ITClub_website\n\nThe SIM ITClub homepage (workshop copy).\n",
          "index.html": CLUB_PAGE('  <nav><a href="#">Home</a> <a href="#">Events</a> <a href="#">Join</a></nav>\n'),
          "style.css": "body { font-family: system-ui, sans-serif; margin: 2rem; }\nnav a { margin-right: 1rem; }\n",
        },
      },
      {
        message: "Fix footer link",
        files: {
          "README.md": "# ITClub_website\n\nThe SIM ITClub homepage (workshop copy).\n",
          "index.html": CLUB_PAGE('  <nav><a href="#">Home</a> <a href="#">Events</a> <a href="#">Join</a></nav>\n').replace(
            "</body>",
            '  <footer><a href="https://github.com/SIMITClubAdmin">Find us on GitHub</a></footer>\n</body>',
          ),
          "style.css": "body { font-family: system-ui, sans-serif; margin: 2rem; }\nnav a { margin-right: 1rem; }\n",
        },
      },
    ],
  },
  "simitclubadmin/hackxperience": {
    name: "hackxperience",
    history: [
      { message: "Initial commit", files: { "README.md": "# HackXperience\n\nThe ITClub hackathon site (workshop copy).\n" } },
      {
        message: "Add schedule",
        files: {
          "README.md": "# HackXperience\n\nThe ITClub hackathon site (workshop copy).\n",
          "schedule.md": "# Schedule\n\n- 09:00 Check-in\n- 10:00 Hacking starts\n- 17:00 Demos\n",
        },
      },
      {
        message: "Add FAQ",
        files: {
          "README.md": "# HackXperience\n\nThe ITClub hackathon site (workshop copy).\n",
          "schedule.md": "# Schedule\n\n- 09:00 Check-in\n- 10:00 Hacking starts\n- 17:00 Demos\n",
          "faq.md": "# FAQ\n\n**Do I need a team?** No, we will help you find one.\n",
        },
      },
    ],
  },
};

const BINARY = /\.(png|jpe?g|gif|webp|ico|bmp|svgz|pdf|zip|gz|tgz|rar|7z|mp3|mp4|mov|webm|wav|ogg|woff2?|ttf|otf|eot|exe|dll|so|dylib|jar|class|psd|ai|sketch|fig)$/i;
const MAX_FILES = 60;
const MAX_BYTES = 150_000;

function parseGithub(url: string) {
  const m = /(?:github\.com[/:])([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i.exec(url.trim());
  return m ? { owner: m[1], repo: m[2] } : null;
}

function receivingLines(files: number, bytes: number, commits: number, note: string) {
  const objects = files + commits * 2;
  return [
    `remote: Enumerating objects: ${objects}, done.`,
    `remote: Counting objects: 100% (${objects}/${objects}), done.`,
    `remote: Compressing objects: 100% (${files}/${files}), done.`,
    `Receiving objects: 100% (${objects}/${objects}), ${(bytes / 1024).toFixed(2)} KiB | 2.4 MiB/s, done.`,
    `Resolving deltas: 100% (${Math.max(0, commits - 1)}/${Math.max(0, commits - 1)}), done.`,
    `\x1b[2m${note}\x1b[0m`,
  ].join("\n");
}

export type CloneResult = { ok: true; name: string; state: RepoState; files: Files; out: string } | { ok: false; out: string };

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (res.status === 404) throw new Error("not-found");
  if (res.status === 403 || res.status === 429) throw new Error("rate-limit");
  if (!res.ok) throw new Error(`http-${res.status}`);
  return res.json();
}

/**
 * Resolves `git clone <url>`: the workshop repos come from the copies above; any other public
 * GitHub repository is fetched through GitHub's API as a shallow clone of its latest snapshot.
 */
export async function resolveClone(url: string, user: { name: string; email: string }, now = Date.now()): Promise<CloneResult> {
  const gh = parseGithub(url);
  if (!gh) {
    return { ok: false, out: `fatal: repository '${url}' not found\n\x1b[33mhint: this sandbox can clone public GitHub repositories, e.g. git clone https://github.com/SIMITClubAdmin/ITClub_website.git\x1b[0m` };
  }
  const remoteUrl = `https://github.com/${gh.owner}/${gh.repo}.git`;
  const known = WORKSHOP_REPOS[`${gh.owner}/${gh.repo}`.toLowerCase()];
  if (known) {
    const state = engine.clonedState(known.history, remoteUrl, now, user);
    const files = known.history[known.history.length - 1].files;
    const bytes = Object.values(files).reduce((n, c) => n + c.length, 0);
    return { ok: true, name: known.name, state, files: { ...files }, out: receivingLines(Object.keys(files).length, bytes, known.history.length, "(workshop copy built into the studio)") };
  }
  try {
    const api = `https://api.github.com/repos/${gh.owner}/${gh.repo}`;
    const meta = (await fetchJson(api)) as { default_branch: string; private?: boolean };
    const branch = meta.default_branch;
    const [commits, tree] = (await Promise.all([fetchJson(`${api}/commits?per_page=1&sha=${encodeURIComponent(branch)}`), fetchJson(`${api}/git/trees/${encodeURIComponent(branch)}?recursive=1`)])) as [
      { sha: string; commit: { message: string; author: { name: string; email: string; date: string } } }[],
      { tree: { path: string; type: string; size?: number }[] },
    ];
    const blobs = tree.tree.filter((t) => t.type === "blob");
    const wanted = blobs.filter((t) => !BINARY.test(t.path) && (t.size ?? 0) <= MAX_BYTES).slice(0, MAX_FILES);
    const files: Files = {};
    const enc = (p: string) => p.split("/").map(encodeURIComponent).join("/");
    for (let i = 0; i < wanted.length; i += 6) {
      await Promise.all(
        wanted.slice(i, i + 6).map(async (t) => {
          const res = await fetch(`https://raw.githubusercontent.com/${gh.owner}/${gh.repo}/${encodeURIComponent(branch)}/${enc(t.path)}`);
          if (res.ok) files[t.path] = await res.text();
        }),
      );
    }
    const head = commits[0];
    const state = engine.clonedState(
      [
        {
          message: head?.commit.message ?? "Latest snapshot",
          files,
          author: head ? `${head.commit.author.name} <${head.commit.author.email}>` : undefined,
          time: head ? Date.parse(head.commit.author.date) : now,
          sha: head?.sha,
        },
      ],
      remoteUrl,
      now,
      user,
    );
    if (branch !== "main") {
      state.branches = { [branch]: "C0" };
      state.remote = { [branch]: "C0" };
      state.tracking = { [branch]: "C0" };
      state.head = branch;
    }
    const skipped = blobs.length - Object.keys(files).length;
    const bytes = Object.values(files).reduce((n, c) => n + c.length, 0);
    const note = `(shallow clone: the latest snapshot of ${branch}${skipped ? `, skipped ${skipped} binary or large file${skipped === 1 ? "" : "s"}` : ""})`;
    return { ok: true, name: gh.repo, state, files, out: receivingLines(Object.keys(files).length, bytes, 1, note) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "not-found") return { ok: false, out: `remote: Repository not found.\nfatal: repository '${remoteUrl}' not found` };
    if (reason === "rate-limit") return { ok: false, out: "fatal: GitHub's rate limit was reached for this network. Try again in a few minutes, or clone a workshop repo." };
    return { ok: false, out: `fatal: unable to access '${remoteUrl}': could not reach GitHub` };
  }
}
