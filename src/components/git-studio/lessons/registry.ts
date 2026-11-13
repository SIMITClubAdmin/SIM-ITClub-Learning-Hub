/** The Git & GitHub track: Lesson 2's slides first, then extra pages under "Additional content". */
export type GitLesson = {
  slug: string;
  number: string;
  title: string;
  summary: string;
  minutes: number;
  additional?: boolean;
  sections: { id: string; title: string }[];
};

export const GIT_LESSONS: GitLesson[] = [
  {
    slug: "introduction",
    number: "01",
    title: "Introduction to Git & GitHub",
    summary: "What Git is, why every developer uses it, and how it differs from GitHub. Then a two-minute setup check.",
    minutes: 15,
    sections: [
      { id: "what-is-git", title: "What is Git?" },
      { id: "save-points", title: "Every commit is a save point" },
      { id: "why-git", title: "Why use Git?" },
      { id: "git-vs-github", title: "Git vs GitHub" },
      { id: "toolkit", title: "Your toolkit today" },
      { id: "setup-check", title: "Setup check" },
    ],
  },
  {
    slug: "core-workflow",
    number: "02",
    title: "The Core Workflow",
    summary: "The three states of Git, explained with a book and a Singapore MRT station, and how push and pull keep your laptop and GitHub in step.",
    minutes: 20,
    sections: [
      { id: "three-states", title: "The three states of Git" },
      { id: "book-analogy", title: "Analogy 1: writing a book" },
      { id: "computer-vs-github", title: "Your computer vs GitHub" },
      { id: "mrt-analogy", title: "Analogy 2: the MRT station" },
      { id: "push-pull", title: "The push vs pull cycle" },
    ],
  },
  {
    slug: "working-with-github",
    number: "03",
    title: "Working with GitHub + Activity 1",
    summary: "Clone, stage, commit, push and pull, in the terminal and in GitHub Desktop. Then do Activity 1 in a real sandbox.",
    minutes: 40,
    sections: [
      { id: "clone", title: "Action 1: clone a repository" },
      { id: "stage", title: "Action 2: see and stage changes" },
      { id: "commit", title: "Action 3: commit" },
      { id: "push-pull", title: "Action 4: push and pull" },
      { id: "fork-pr", title: "Fork & pull request" },
      { id: "activity-1", title: "Activity 1" },
    ],
  },
  {
    slug: "branching",
    number: "04",
    title: "Branching & Merging + Activity 2",
    summary: "Branches let you try ideas without touching main. Learn to create, publish and switch them, then do Activity 2.",
    minutes: 30,
    sections: [
      { id: "what-is-a-branch", title: "What is a branch?" },
      { id: "why-branch", title: "Why branch?" },
      { id: "best-practices", title: "Best practices" },
      { id: "create-switch", title: "Create & switch branches" },
      { id: "activity-2", title: "Activity 2" },
    ],
  },
  {
    slug: "pull-requests-conflicts",
    number: "05",
    title: "Pull Requests, Merge Conflicts + Activity 3",
    summary: "Combine branches with git merge, merge into main through a pull request, fix a merge conflict, then play the branching game.",
    minutes: 45,
    sections: [
      { id: "git-merge", title: "Combining branches" },
      { id: "pull-request", title: "Merging into main: the PR" },
      { id: "merge-conflicts", title: "Merge conflicts" },
      { id: "activity-3", title: "Activity 3: branching game" },
    ],
  },
  {
    slug: "tips-cheatsheet",
    number: "06",
    title: "Additional Tips & Cheatsheet",
    summary: "main vs master, the do's and don'ts, stash and revert, and every command from today on one page.",
    minutes: 10,
    sections: [
      { id: "main-vs-master", title: "main vs master" },
      { id: "dos", title: "Do's" },
      { id: "donts", title: "Don'ts" },
      { id: "pro-tips", title: "Pro tips" },
      { id: "cheatsheet", title: "Cheatsheet" },
    ],
  },
  {
    slug: "sandbox",
    number: "A1",
    title: "Full WebContainer Dev Sandbox",
    summary: "A real Node.js project in your browser: edit the portal, run npm run dev, and push your commits to a pretend GitHub.",
    minutes: 30,
    additional: true,
    sections: [
      { id: "sandbox", title: "The sandbox" },
      { id: "how-push-works", title: "How a push really works" },
    ],
  },
  {
    slug: "advanced",
    number: "A2",
    title: "Advanced Git: Rebase, Cherry-Pick & Stash",
    summary: "Shelve work with stash, copy single commits with cherry-pick, undo safely with revert, and tidy history with rebase.",
    minutes: 30,
    additional: true,
    sections: [
      { id: "stash", title: "git stash" },
      { id: "cherry-pick", title: "git cherry-pick" },
      { id: "revert", title: "git revert" },
      { id: "rebase", title: "git rebase" },
      { id: "try-it", title: "Try it" },
    ],
  },
];

export const gitLessonHref = (slug: string) => `/learn/git/${slug}`;

export function findGitLesson(slug: string) {
  const i = GIT_LESSONS.findIndex((l) => l.slug === slug);
  if (i === -1) return null;
  return { lesson: GIT_LESSONS[i], prev: GIT_LESSONS[i - 1] ?? null, next: GIT_LESSONS[i + 1] ?? null };
}
