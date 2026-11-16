import { createMiniGit, type Files, type GitIo, type RepoState } from "./mini-git";
import { STARTER_FILES } from "./sandbox-files";

const engine = createMiniGit();

export type StudioVariant =
  | "portal"
  | "activity1"
  | "activity2"
  | "game1"
  | "game2"
  | "game3"
  | "game4"
  | "advanced"
  | "skull1"
  | "skull2"
  | "skull3"
  | "skull4"
  | "skull5";

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
function scripted(steps: Step[], start: number, state: RepoState = engine.emptyState(), files: Files = {}) {
  const folder = new MemFolder(files, start);
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
    case "skull1":
    case "skull2":
    case "skull3":
    case "skull4":
    case "skull5": {
      const repo = SKULL_BUILDERS[variant](start);
      return { startDir: JEFF_FOLDER, allowDev: false, hidden: [], files: inFolder(JEFF_FOLDER, repo.files, repo.state) };
    }
  }
}

// ---------- Jeff's portfolio (Activity 3 and the Skull Trials) ----------

export const JEFF_REPO_URL = "https://github.com/aeomantic/Jeff-s-Portfolio-Website.git";
export const JEFF_FOLDER = "Jeff-s-Portfolio-Website";
const JEFF = { name: "Jeff", email: "jeff@portfolio.dev" };
const JEFF_AUTHOR = `${JEFF.name} <${JEFF.email}>`;
const STUDENT = { name: "ITCamp Student", email: "student@itclub.dev" };

const jeffPage = ({
  title = "Jeff · Portfolio",
  header,
  main,
  footer,
  script = "script.js",
}: {
  title?: string;
  header: string;
  main: string;
  footer?: string;
  script?: string;
}) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
${header}
  </header>
  <main>
${main}
  </main>
${footer ? `${footer}
` : ""}  <script src="${script}"></script>
</body>
</html>
`;

const nav = (links: string[]) => ["    <nav>", ...links.map((l) => `      ${l}`), "    </nav>"].join("\n");
const ABOUT = `    <section id="about">
      <h2>About me</h2>
      <p>I build websites with HTML, CSS and JavaScript.</p>
    </section>`;
const NAV_LINKS = ['<a href="#about">About</a>', '<a href="#projects">Projects</a>'];

const JEFF_README = "# Jeff's Portfolio Website\n\nMy personal portfolio: who I am, what I build and how to reach me.\n\nOpen index.html in a browser to see it.\n";
const JEFF_INDEX = jeffPage({ header: `    <h1>Jeff's Portfolio</h1>\n${nav(NAV_LINKS)}`, main: ABOUT });
const JEFF_STYLES = `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #1f2937;
}

header {
  padding: 1.5rem 2rem;
  background: #111827;
  color: #ffffff;
}

nav a {
  margin-right: 1rem;
  color: #93c5fd;
}

main {
  padding: 2rem;
}
`;
const JEFF_SCRIPT = `// Says hello in the browser console, so Jeff can see the page loaded.
const year = new Date().getFullYear();
console.log("Jeff's portfolio is live in " + year);
`;

const JEFF_HISTORY: CloneCommit[] = [
  { message: "Initial commit", author: JEFF_AUTHOR, files: { "README.md": JEFF_README } },
  { message: "Add homepage", author: JEFF_AUTHOR, files: { "README.md": JEFF_README, "index.html": JEFF_INDEX, "styles.css": JEFF_STYLES } },
  { message: "Add script", author: JEFF_AUTHOR, files: { "README.md": JEFF_README, "index.html": JEFF_INDEX, "styles.css": JEFF_STYLES, "script.js": JEFF_SCRIPT } },
];

/** The commit teammate Jeff pushes to GitHub once a student has cloned his portfolio (Activity 3, level 4). */
export const JEFF_PUSH_MESSAGE = "Add projects page";
const JEFF_PROJECTS = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Jeff · Projects</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <h1>My projects</h1>
  <ul>
    <li>Weather app</li>
    <li>To-do list</li>
  </ul>
</body>
</html>
`;

/** Whether teammate Jeff's push is already on GitHub in this repository. */
export function hasJeffPush(state: RepoState) {
  return Object.values(state.commits).some((c) => c.message === JEFF_PUSH_MESSAGE && c.author === JEFF_AUTHOR);
}

/** Adds Jeff's "Add projects page" commit to GitHub's main, or null if it is already there. */
export function withJeffPush(state: RepoState, now = Date.now()): RepoState | null {
  if (hasJeffPush(state) || !state.remote.main) return null;
  const files = { ...engine.treeOf(state, state.remote.main), "projects.html": JEFF_PROJECTS };
  return engine.teammateCommit(state, "main", { message: JEFF_PUSH_MESSAGE, author: JEFF_AUTHOR, files, time: now });
}

/** A fresh clone of Jeff's portfolio, as the starting point of a Skull Trial, with Jeff as the committer while it is built. */
function jeffClone(start: number) {
  const state = engine.clonedState(JEFF_HISTORY, JEFF_REPO_URL, start, JEFF);
  return { state, files: { ...JEFF_HISTORY[JEFF_HISTORY.length - 1].files } };
}

/** Hands the finished repository to the student: their name on new commits from here on. */
function forStudent(repo: { state: RepoState; files: Files }) {
  return { state: { ...repo.state, user: { ...STUDENT } }, files: repo.files };
}

/** The hero heading Skull Trial 1 is about. */
export const HERO_HEADING = "<h1>Hi, I'm Jeff — Full-Stack Developer</h1>";

const SKULL_BUILDERS: Record<"skull1" | "skull2" | "skull3" | "skull4" | "skull5", (start: number) => { state: RepoState; files: Files }> = {
  // Branch Sprawl Rescue: four leftover branches; only feature/hero-banner has the finished hero.
  // The decoys' commits are all in hero-banner's history, so once it is merged into main,
  // `git branch -d` can delete every one of them.
  skull1(start) {
    const base = jeffClone(start);
    const oldHeader = jeffPage({ header: `    <h1>JEFF'S PORTFOLIO!!!</h1>\n${nav(NAV_LINKS)}`, main: ABOUT });
    const brokenNav = jeffPage({ header: `    <h1>JEFF'S PORTFOLIO!!!</h1>\n${nav(['<a href="#abuot">About</a>', '<a href="#projcts">Projects</a>'])}`, main: ABOUT });
    const hero = jeffPage({ header: `    ${HERO_HEADING}\n${nav(NAV_LINKS)}`, main: ABOUT });
    return forStudent(
      scripted(
        [
          { git: ["switch", "-c", "feature/old-header"] },
          { write: { "index.html": oldHeader }, git: ["add", "."] },
          { git: ["commit", "-m", "Try a bigger header"] },
          { git: ["switch", "-c", "feature/broken-nav"] },
          { write: { "index.html": brokenNav }, git: ["add", "."] },
          { git: ["commit", "-m", "Rework the nav links"] },
          { git: ["branch", "temp/draft-1"] },
          { git: ["switch", "-c", "feature/hero-banner"] },
          { write: { "index.html": hero }, git: ["add", "."] },
          { git: ["commit", "-m", "Polish the header"] },
          { git: ["switch", "temp/draft-1"] },
        ],
        start,
        base.state,
        base.files,
      ),
    );
  },

  // The Uncommitted Stash & Diverged Main Crisis: an unfinished contact section that must not be
  // committed, a finished fix on fix/navbar-link, and one teammate commit on GitHub's main.
  skull2(start) {
    const base = jeffClone(start);
    const typoNav = jeffPage({ header: `    <h1>Jeff's Portfolio</h1>\n${nav(['<a href="#abuot">About</a>', '<a href="#projects">Projects</a>'])}`, main: ABOUT });
    const fixedNav = jeffPage({ header: `    <h1>Jeff's Portfolio</h1>\n${nav(NAV_LINKS)}`, main: ABOUT });
    const contactNav = jeffPage({
      header: `    <h1>Jeff's Portfolio</h1>\n${nav(['<a href="#abuot">About</a>', '<a href="#projects">Projects</a>', '<a href="#contact">Contact</a>'])}`,
      main: ABOUT,
    });
    const draft = jeffPage({
      header: `    <h1>Jeff's Portfolio</h1>\n${nav(['<a href="#abuot">About</a>', '<a href="#projects">Projects</a>', '<a href="#contact">Contact</a>'])}`,
      main: `${ABOUT}\n    <section id="contact">\n      <h2>Contact me</h2>\n      <p>TODO: add my email and LinkedIn</p>\n    </section>`,
    });
    const repo = scripted(
      [
        { write: { "index.html": typoNav }, git: ["add", "."] },
        { git: ["commit", "-m", "Update the nav"] },
        { git: ["push"] },
        { git: ["switch", "-c", "fix/navbar-link"] },
        { write: { "index.html": fixedNav }, git: ["add", "."] },
        { git: ["commit", "-m", "Fix the About link in the nav"] },
        { git: ["switch", "main"] },
        { git: ["switch", "-c", "feature/contact-section"] },
        { write: { "index.html": contactNav }, git: ["add", "."] },
        { git: ["commit", "-m", "Add Contact to the nav"] },
        // The unfinished draft: saved in the editor, never staged or committed.
        { write: { "index.html": draft } },
      ],
      start,
      base.state,
      base.files,
    );
    const readme = `${JEFF_README}\nContact: jeff@portfolio.dev\n`;
    const pushed = engine.teammateCommit(repo.state, "main", {
      message: "Add contact email to README",
      author: JEFF_AUTHOR,
      files: { ...engine.treeOf(repo.state, repo.state.remote.main), "README.md": readme },
      time: start + 3600_000,
    });
    return forStudent({ state: pushed ?? repo.state, files: repo.files });
  },

  // Multi-Branch Real Code Merge Conflict: both feature branches change the same lines of app.js
  // and the same header line of index.html.
  skull3(start) {
    const base = jeffClone(start);
    const page = (role: string, skills: string) =>
      jeffPage({
        header: `    <h1>Jeff · ${role}</h1>`,
        main: `    <article class="card">\n      <h2>Skills</h2>\n      <p id="skills">${skills}</p>\n    </article>`,
        script: "app.js",
      });
    const app = (body: string) => `const developer = {\n${body}\n};\n\ndocument.querySelector("#skills").textContent = developer.skills.join(", ");\n`;
    const repo = scripted(
      [
        {
          write: {
            "index.html": page("Frontend Developer", "HTML, CSS"),
            "app.js": app('  name: "Jeff",\n  role: "Frontend Developer",\n  skills: ["HTML", "CSS"]'),
          },
          git: ["add", "."],
        },
        { git: ["commit", "-m", "Add developer card"] },
        { git: ["push"] },
        { git: ["switch", "-c", "feature/skills-update"] },
        {
          write: {
            "index.html": page("Web Developer", "HTML, CSS, JavaScript, Git"),
            "app.js": app('  name: "Jeff",\n  role: "Web Developer",\n  skills: ["HTML", "CSS", "JavaScript", "Git"]'),
          },
          git: ["add", "."],
        },
        { git: ["commit", "-m", "Update skills"] },
        { git: ["switch", "main"] },
        { git: ["switch", "-c", "feature/role-update"] },
        {
          write: {
            "index.html": page("Full-Stack Developer", "HTML, CSS"),
            "app.js": app('  name: "Jeff",\n  role: "Full-Stack Developer",\n  skills: ["HTML", "CSS"],\n  github: "@aeomantic"'),
          },
          git: ["add", "."],
        },
        { git: ["commit", "-m", "Update role and add GitHub"] },
        { git: ["switch", "main"] },
      ],
      start,
      base.state,
      base.files,
    );
    return forStudent(repo);
  },

  // Hotfix Cherry-Pick & Safe Rollback: a pushed commit wiped the About text (undo it without
  // rewriting history), and the footer email fix sits on an unfinished branch (C7) that must
  // not be merged. Commit ids: C3 projects, C4 the wipe, C5 footer, C6-C8 feature/redesign.
  skull4(start) {
    const base = jeffClone(start);
    const header = `    <h1>Jeff's Portfolio</h1>\n${nav(NAV_LINKS)}`;
    const projects = `    <section id="projects">\n      <h2>Projects</h2>\n      <p>A weather app and a to-do list.</p>\n    </section>`;
    const wiped = ABOUT.replace("<p>I build websites with HTML, CSS and JavaScript.</p>", "<p>TODO: write something here</p>");
    const footer = (email: string) => `  <footer>\n    <a href="mailto:${email}">Email me</a>\n  </footer>`;
    const dark = `${JEFF_STYLES}\n/* Dark theme (work in progress) */\nbody {\n  background: #0b1120;\n  color: #e5e7eb;\n}\n`;
    const darker = `${dark}\nnav a {\n  color: #fbbf24;\n}\n`;
    return forStudent(
      scripted(
        [
          { write: { "index.html": jeffPage({ header, main: `${ABOUT}\n${projects}` }) }, git: ["add", "."] },
          { git: ["commit", "-m", "Add projects section"] },
          { git: ["push"] },
          { write: { "index.html": jeffPage({ header, main: `${wiped}\n${projects}` }) }, git: ["add", "."] },
          { git: ["commit", "-m", "Rewrite the About section"] },
          { git: ["push"] },
          { write: { "index.html": jeffPage({ header, main: `${wiped}\n${projects}`, footer: footer("jeff@portfoilo.dev") }) }, git: ["add", "."] },
          { git: ["commit", "-m", "Add footer"] },
          { git: ["push"] },
          { git: ["switch", "-c", "feature/redesign"] },
          { write: { "styles.css": dark }, git: ["add", "."] },
          { git: ["commit", "-m", "Start dark theme"] },
          { write: { "index.html": jeffPage({ header, main: `${wiped}\n${projects}`, footer: footer("jeff@portfolio.dev") }) }, git: ["add", "."] },
          { git: ["commit", "-m", "Fix footer email link"] },
          { write: { "styles.css": darker }, git: ["add", "."] },
          { git: ["commit", "-m", "Dark theme nav colours"] },
        ],
        start,
        base.state,
        base.files,
      ),
    );
  },

  // Release Day Meltdown: an uncommitted draft on feature/testimonials, an unpushed commit on main
  // that clashes with Jeff's pushed header change, and feature/blog ready to ship.
  skull5(start) {
    const base = jeffClone(start);
    const withTestimonials = [...NAV_LINKS, '<a href="#testimonials">Testimonials</a>'];
    const blog = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Jeff · Blog</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <h1>Jeff's blog</h1>
  <p>First post: how I learned Git without losing my work.</p>
</body>
</html>
`;
    const testimonialsNav = jeffPage({ header: `    <h1>Jeff's Portfolio</h1>\n${nav(withTestimonials)}`, main: ABOUT });
    const draft = jeffPage({
      header: `    <h1>Jeff's Portfolio</h1>\n${nav(withTestimonials)}`,
      main: `${ABOUT}\n    <section id="testimonials">\n      <h2>What people say</h2>\n      <p>TODO: add quotes from clients</p>\n    </section>`,
    });
    const repo = scripted(
      [
        { git: ["switch", "-c", "feature/blog"] },
        { write: { "blog.html": blog }, git: ["add", "."] },
        { git: ["commit", "-m", "Add blog page"] },
        { git: ["switch", "main"] },
        { git: ["switch", "-c", "feature/testimonials"] },
        { write: { "index.html": testimonialsNav }, git: ["add", "."] },
        { git: ["commit", "-m", "Add Testimonials to the nav"] },
        { git: ["switch", "main"] },
        // Your own commit, never pushed.
        { write: { "index.html": jeffPage({ header: `    <h1>Jeff's Portfolio · Web Developer</h1>\n${nav(NAV_LINKS)}`, main: ABOUT }) }, git: ["add", "."] },
        { git: ["commit", "-m", "Update the header"] },
        { git: ["switch", "feature/testimonials"] },
        // The unfinished draft: saved in the editor, never staged or committed.
        { write: { "index.html": draft } },
      ],
      start,
      base.state,
      base.files,
    );
    // Jeff changed the same header line on GitHub.
    const remoteTree = engine.treeOf(repo.state, repo.state.remote.main);
    const pushed = engine.teammateCommit(repo.state, "main", {
      message: "Rename the header",
      author: JEFF_AUTHOR,
      files: { ...remoteTree, "index.html": jeffPage({ header: `    <h1>Jeff · Full-Stack Developer</h1>\n${nav(NAV_LINKS)}`, main: ABOUT }) },
      time: start + 3600_000,
    });
    return forStudent({ state: pushed ?? repo.state, files: repo.files });
  },
};

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
  "aeomantic/jeff-s-portfolio-website": { name: JEFF_FOLDER, history: JEFF_HISTORY },
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
