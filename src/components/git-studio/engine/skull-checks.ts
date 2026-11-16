import { createMiniGit, type Files, type RepoState, type RepoStatus } from "./mini-git";
import { HERO_HEADING } from "./workspaces";

/**
 * The repository state each Skull Trial must reach (see src/lib/skull-trials.ts for the text the
 * student reads). Pure, so the studio checks it after every command and tests can run it too.
 */

const engine = createMiniGit();

export type TrialSnapshot = {
  repo: RepoState;
  /** The files in the repository's folder, as saved. */
  files: Files;
  status: RepoStatus;
};

const MARKERS = /^(<{7}|={7}|>{7})/m;
const squash = (text: string) => text.replace(/\s+/g, " ");

const clean = ({ repo, status }: TrialSnapshot) =>
  !repo.merging && !status.staged.length && !status.unstaged.length && !status.untracked.length && !status.conflicted.length;

/** Local main is on GitHub, and GitHub's main is exactly local main. */
const mainPushed = (repo: RepoState) => Boolean(repo.branches.main) && repo.remote.main === repo.branches.main;

/** Whether a commit with this message is part of `tip`'s history. */
function hasCommit(repo: RepoState, tip: string | undefined, message: string) {
  const seen = engine.reachable(repo, tip);
  return Object.values(repo.commits).some((c) => c.message === message && seen.has(c.id));
}

function validJs(source: string) {
  try {
    // Parses only: the function is never called.
    new Function(source);
    return true;
  } catch (error) {
    return !(error instanceof SyntaxError);
  }
}

const once = (source: string, key: string) => (source.match(new RegExp(`\\b${key}\\s*:`, "g")) ?? []).length === 1;

/** Trial 3's app.js: valid, no markers, and exactly the combined developer object. */
export function appJsOk(app: string) {
  return (
    !MARKERS.test(app) &&
    validJs(app) &&
    ["name", "role", "skills", "github"].every((key) => once(app, key)) &&
    /\bname\s*:\s*(["'])Jeff\1/.test(app) &&
    /\brole\s*:\s*(["'])Full-Stack Developer\1/.test(app) &&
    /\bskills\s*:\s*\[\s*(["'])HTML\1\s*,\s*(["'])CSS\2\s*,\s*(["'])JavaScript\3\s*,\s*(["'])Git\4\s*,?\s*\]/.test(app) &&
    /\bgithub\s*:\s*(["'])@aeomantic\1/.test(app)
  );
}

/** Trial 3's index.html: no markers, the new header title and the full skills card. */
export function indexHtmlOk(html: string) {
  const flat = squash(html);
  return !MARKERS.test(html) && flat.includes("<h1>Jeff · Full-Stack Developer</h1>") && flat.includes('<p id="skills">HTML, CSS, JavaScript, Git</p>');
}

export type TrialId = 1 | 2 | 3 | 4 | 5;

const CHECKS: Record<TrialId, (s: TrialSnapshot) => boolean> = {
  // Only main is left, it has the hero heading, it is clean and it is on GitHub.
  1: (s) => {
    const { repo } = s;
    const names = Object.keys(repo.branches);
    const main = engine.treeOf(repo, repo.branches.main ?? null);
    return names.length === 1 && names[0] === "main" && repo.head === "main" && !repo.detached && (main["index.html"] ?? "").includes(HERO_HEADING) && clean(s) && mainPushed(repo);
  },
  // GitHub's main has Jeff's commit and the fix, local main matches it, and the draft is back
  // on feature/contact-section, uncommitted.
  2: (s) => {
    const { repo, files } = s;
    const head = engine.treeOf(repo, engine.headId(repo));
    return (
      repo.head === "feature/contact-section" &&
      !repo.detached &&
      mainPushed(repo) &&
      hasCommit(repo, repo.remote.main, "Add contact email to README") &&
      hasCommit(repo, repo.remote.main, "Fix the About link in the nav") &&
      (files["index.html"] ?? "").includes('<section id="contact">') &&
      !(head["index.html"] ?? "").includes('<section id="contact">')
    );
  },
  // Both feature branches are in main, the committed files are resolved to the spec, the tree is
  // clean and main is on GitHub.
  3: (s) => {
    const { repo } = s;
    const main = engine.treeOf(repo, repo.branches.main ?? null);
    return (
      hasCommit(repo, repo.branches.main, "Update skills") &&
      hasCommit(repo, repo.branches.main, "Update role and add GitHub") &&
      appJsOk(main["app.js"] ?? "") &&
      indexHtmlOk(main["index.html"] ?? "") &&
      clean(s) &&
      mainPushed(repo)
    );
  },
  // main has the footer fix copied from feature/redesign (not merged), the About wipe undone by a
  // new commit with GitHub's history kept, and is pushed; feature/redesign is untouched.
  4: (s) => {
    const { repo } = s;
    const mainTip = repo.branches.main;
    const main = engine.treeOf(repo, mainTip ?? null);
    const html = main["index.html"] ?? "";
    const redesign = repo.branches["feature/redesign"];
    return (
      !MARKERS.test(html) &&
      html.includes('href="mailto:jeff@portfolio.dev"') &&
      !html.includes("portfoilo") &&
      html.includes("<p>I build websites with HTML, CSS and JavaScript.</p>") &&
      !html.includes("TODO: write something here") &&
      !/Dark theme/.test(main["styles.css"] ?? "") &&
      hasCommit(repo, mainTip, "Rewrite the About section") &&
      hasCommit(repo, mainTip, "Add footer") &&
      !hasCommit(repo, mainTip, "Start dark theme") &&
      !hasCommit(repo, mainTip, "Dark theme nav colours") &&
      Boolean(redesign) &&
      hasCommit(repo, redesign, "Dark theme nav colours") &&
      clean(s) &&
      mainPushed(repo)
    );
  },
  // main has Jeff's commit, your commit and feature/blog with the header resolved, and is pushed;
  // feature/blog is gone; you are back on a published feature/testimonials with the draft restored.
  5: (s) => {
    const { repo, files } = s;
    const mainTip = repo.branches.main;
    const main = engine.treeOf(repo, mainTip ?? null);
    const html = main["index.html"] ?? "";
    const head = engine.treeOf(repo, engine.headId(repo));
    const feature = repo.branches["feature/testimonials"];
    return (
      mainPushed(repo) &&
      hasCommit(repo, mainTip, "Rename the header") &&
      hasCommit(repo, mainTip, "Update the header") &&
      hasCommit(repo, mainTip, "Add blog page") &&
      !MARKERS.test(html) &&
      (html.match(/<h1>/g) ?? []).length === 1 &&
      squash(html).includes("<h1>Jeff's Portfolio · Full-Stack Developer</h1>") &&
      "blog.html" in main &&
      !repo.branches["feature/blog"] &&
      repo.head === "feature/testimonials" &&
      !repo.detached &&
      Boolean(feature) &&
      repo.remote["feature/testimonials"] === feature &&
      engine.trk(repo)["feature/testimonials"] === feature &&
      (files["index.html"] ?? "").includes('<section id="testimonials">') &&
      !(head["index.html"] ?? "").includes('<section id="testimonials">')
    );
  },
};

export function trialSolved(trial: TrialId, snapshot: TrialSnapshot) {
  return CHECKS[trial](snapshot);
}
