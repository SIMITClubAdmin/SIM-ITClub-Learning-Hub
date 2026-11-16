/**
 * The optional Skull Trials after the Lesson 2 mini challenges: hands-on boss challenges in the
 * Git studio, with no hints, no cheatsheet and no multiple choice. Solving one unlocks a title
 * that a top-3 member can show beside their name on the leaderboard.
 *
 * Browser-safe: the goal checks live with the studio (src/components/git-studio/SkullTrialGuide).
 * Text in `backticks` is shown as code.
 */

export type TitleId = "novice" | "amateur" | "expert";

export type SkullTitle = { id: TitleId; label: string; skulls: number; trial: number };

/** In unlock order. */
export const SKULL_TITLES: SkullTitle[] = [
  { id: "novice", label: "git novice", skulls: 1, trial: 1 },
  { id: "amateur", label: "git amateur", skulls: 2, trial: 2 },
  { id: "expert", label: "git expert", skulls: 3, trial: 3 },
];

export function isTitleId(value: unknown): value is TitleId {
  return SKULL_TITLES.some((t) => t.id === value);
}

export function skullTitle(id: TitleId) {
  return SKULL_TITLES.find((t) => t.id === id)!;
}

/** "💀💀 git amateur" */
export function titleText(id: TitleId) {
  const t = skullTitle(id);
  return `${"💀".repeat(t.skulls)} ${t.label}`;
}

/** Known title ids from untrusted profile data, without repeats, in unlock order. */
export function cleanTitleIds(raw: unknown): TitleId[] {
  const list = Array.isArray(raw) ? raw : [];
  return SKULL_TITLES.map((t) => t.id).filter((id) => list.includes(id));
}

/** The title a member may show: one they chose and have unlocked, or null. */
export function equippedTitle(equipped: unknown, unlocked: unknown): TitleId | null {
  return isTitleId(equipped) && cleanTitleIds(unlocked).includes(equipped) ? equipped : null;
}

/** Profile metadata keys (Supabase auth user_metadata), next to hub_tagline. */
export const TITLES_KEY = "hub_unlocked_titles";
export const EQUIPPED_KEY = "hub_equipped_title";

export type SkullTrial = {
  id: 1 | 2 | 3;
  name: string;
  difficulty: string;
  reward: TitleId;
  /** The scenario briefing. */
  problem: string;
  /** The state the repository must reach to pass. */
  expected: string[];
  /** The shortest way to solve it. Entries starting with "✎" are editor steps, not commands. */
  optimal: string[];
};

export const SKULL_TRIALS: SkullTrial[] = [
  {
    id: 1,
    name: "Branch Sprawl Rescue",
    difficulty: "Hard",
    reward: "novice",
    problem:
      "Jeff created way too many branches while experimenting on his portfolio and lost track of where his finished hero banner is. Right now you are on `temp/draft-1`, and `main` is still outdated.",
    expected: [
      "The branch whose `index.html` has `<h1>Hi, I'm Jeff — Full-Stack Developer</h1>` is merged into `main`.",
      "The 4 leftover branches (`feature/old-header`, `feature/broken-nav`, `feature/hero-banner` and `temp/draft-1`) are deleted with `git branch -d`, so only `main` is left locally.",
      "`main` is pushed to GitHub (`origin/main`) and the working directory is clean.",
    ],
    optimal: [
      "git switch main",
      "git merge feature/hero-banner",
      "git branch -d feature/hero-banner feature/old-header feature/broken-nav temp/draft-1",
      "git push",
    ],
  },
  {
    id: 2,
    name: "The Uncommitted Stash & Diverged Main Crisis",
    difficulty: "Very hard",
    reward: "amateur",
    problem:
      "You are halfway through coding the contact section in `index.html` on `feature/contact-section`. Do not commit or lose this draft! Suddenly Jeff needs you to switch to `main`, pull the latest update from GitHub (`origin/main`), merge the finished `fix/navbar-link` branch into `main` and push `main` to GitHub. Then come back to `feature/contact-section` with your uncommitted contact-section draft restored in your working directory.",
    expected: [
      "`main` has the latest commit from `origin/main` and the `fix/navbar-link` branch merged in, and the combined history is pushed to `origin/main`.",
      "You are back on `feature/contact-section` (it is your `HEAD`).",
      'Your `<section id="contact">` draft is back in `index.html` in the working directory, still uncommitted.',
    ],
    optimal: [
      "git stash",
      "git switch main",
      "git pull",
      "git merge fix/navbar-link",
      "git push",
      "git switch feature/contact-section",
      "git stash pop",
    ],
  },
  {
    id: 3,
    name: "Multi-Branch Real Code Merge Conflict",
    difficulty: "Most difficult",
    reward: "expert",
    problem:
      "Two feature branches, `feature/skills-update` and `feature/role-update`, edited the same lines of code in `app.js` and `index.html`. Merge both branches into `main`, resolve the merge conflicts in the editor so that no conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) are left and the code matches the spec below, commit the resolved merge, and push to `origin/main`.",
    expected: [
      "Both `feature/skills-update` and `feature/role-update` are merged into `main`.",
      '`app.js` on `main` is valid JavaScript with no conflict markers, and `developer` has exactly: `name: "Jeff"`, `role: "Full-Stack Developer"`, `skills: ["HTML", "CSS", "JavaScript", "Git"]` and `github: "@aeomantic"`.',
      '`index.html` on `main` has no conflict markers, the header title `<h1>Jeff · Full-Stack Developer</h1>` and the skills card `<p id="skills">HTML, CSS, JavaScript, Git</p>`.',
      "The working tree is clean (resolved files saved, staged and committed) and `main` is pushed to `origin/main`.",
    ],
    optimal: [
      "git merge feature/role-update",
      "git merge feature/skills-update",
      "✎ Fix app.js and index.html in the editor, then save (Ctrl+S)",
      "git add .",
      'git commit -m "Resolve merge conflicts"',
      "git push",
    ],
  },
];

export function findTrial(id: number) {
  return SKULL_TRIALS.find((t) => t.id === id) ?? null;
}

/** Git commands in the shortest solution (editor steps don't count). */
export function optimalCount(trial: SkullTrial) {
  return trial.optimal.filter((step) => !step.startsWith("✎")).length;
}

/** The trial pages are cross-origin isolated (the studio's WebContainer needs it). */
export const SKULL_TRIAL_PATH = "/practice/skull";

export function trialHref(id: number) {
  return `${SKULL_TRIAL_PATH}/${id}`;
}
