/**
 * The Git command cheatsheet shown beside the Lesson 2 mini challenges. Commands keep their
 * <placeholders>, so students still have to apply the right names and flags to each question.
 *
 * Only what the Lesson 2 slides teach up to Mini Challenge 3, plus the CLI vs GitHub Desktop
 * table from the two Cheatsheet slides (71-72). Nothing else from the Additional Tips slides (63-70).
 *
 * Text in `backticks` is shown as code.
 */

export type CheatTab = "all" | "desktop" | "c1" | "c2" | "c3";

export const CHEAT_TABS: { id: CheatTab; label: string }[] = [
  { id: "all", label: "All commands" },
  { id: "desktop", label: "CLI vs. GitHub Desktop" },
  { id: "c1", label: "Challenge 1: Setup & core workflow" },
  { id: "c2", label: "Challenge 2: Branching & switching" },
  { id: "c3", label: "Challenge 3: Merging, PRs & conflicts" },
];

/** The challenges that show the cheatsheet, and the tab each one opens on. */
const START_TAB: Record<string, CheatTab> = { "git-basics": "c1", branches: "c2", github: "c3" };

/** The tab this challenge's cheatsheet opens on, or null when the challenge has no cheatsheet. */
export function gitCheatsheetTab(slug: string): CheatTab | null {
  return Object.hasOwn(START_TAB, slug) ? START_TAB[slug] : null;
}

/** The Cheatsheet slide: [action, terminal, GitHub Desktop]. */
export const DESKTOP_ROWS: [string, string, string][] = [
  ["Clone", "`git clone <url>`", "File > Clone repository"],
  ["See changes", "`git status`", "Changes tab"],
  ["Stage", "`git add .` (or `git add <file>`)", "Tick the file checkboxes"],
  ["Commit", '`git commit -m "<msg>"`', "Summary + Commit to <branch>"],
  ["Push", "`git push`", "Push origin / Publish branch"],
  ["Pull", "`git pull`", "Fetch origin, then Pull origin"],
  ["New branch", "`git switch -c <feature/x>`", "Current branch > New branch"],
  ["Switch branch", "`git switch <branch>` (e.g. `main`)", "Current branch dropdown"],
  ["Update from main", "`git pull origin main`", "Branch > Update from main"],
  ["Merge into main", "Pull Request on GitHub", "Create Pull Request"],
];

export const GOLDEN_RULE = "Pull before you work. Branch off main. Merge with a PR.";

/** A command (or its equivalents) and what it does. */
export type CheatCommand = { cmds: string[]; does: string };

export const SETUP_COMMANDS: CheatCommand[] = [
  { cmds: ["git --version"], does: "Check which version of Git is installed." },
  { cmds: ['git config --global user.name "<Name>"'], does: "Set your Git username for every project." },
  { cmds: ['git config --global user.email "<email>"'], does: "Set your Git email (use the same email as your GitHub account)." },
  { cmds: ["git init"], does: "Start a new local repository (the hidden `.git` folder) in the current folder." },
  { cmds: ["git status"], does: "See which files are modified, staged or untracked." },
  {
    cmds: ["git add <file>", "git add ."],
    does: "Stage one file, or every change, into the Staging Area: pages into the open envelope.",
  },
  { cmds: ['git commit -m "<message>"'], does: "Seal what is staged into a snapshot in your local repository." },
  { cmds: ["git log", "git log --oneline"], does: "See the commit history, in full or one line per commit." },
  { cmds: ["git clone <url>"], does: "Download a repository from GitHub to your laptop (first time only)." },
  { cmds: ["git pull"], does: "Download the latest commits from GitHub and merge them into your current branch." },
  { cmds: ["git push"], does: "Upload your commits to GitHub." },
];

export const BRANCH_COMMANDS: CheatCommand[] = [
  { cmds: ["git branch"], does: "List your local branches. `*` marks the one you are on." },
  { cmds: ["git branch <branch-name>"], does: "Create a branch, without switching to it." },
  { cmds: ["git checkout <branch-name>", "git switch <branch-name>"], does: "Switch to a branch that already exists." },
  {
    cmds: ["git switch -c <branch-name>", "git checkout -b <branch-name>"],
    does: "Create a branch and switch to it, in one step.",
  },
  {
    cmds: ["git push -u origin <branch-name>"],
    does: "Publish a new branch to GitHub (`origin`) the first time, and track it.",
  },
];

export const MERGE_COMMANDS: CheatCommand[] = [
  { cmds: ["git merge <branch-name>"], does: "Bring `<branch-name>`'s commits into the branch you are on." },
  { cmds: ["git branch -d <branch-name>"], does: "Delete a local branch once its work is merged." },
];

/** Pull request direction on GitHub. */
export const PR_DIRECTION = { base: "base: main", compare: "compare: <your-branch>", means: "Merges `<your-branch>` into `main`." };

/** What each conflict marker means: [marker, meaning]. */
export const CONFLICT_MARKERS: [string, string][] = [
  ["<<<<<<< HEAD", "Current Change: what is on the branch you are on (e.g. `main`)."],
  ["=======", "The divider between the two versions."],
  [">>>>>>> <branch-name>", "Incoming Change: what is on the branch being merged in."],
];

/** After editing the file to resolve the conflict. */
export const RESOLVE_STEPS = ["Save the file (Ctrl+S)", "`git add <file>`", '`git commit -m "merge conflict"`'];
