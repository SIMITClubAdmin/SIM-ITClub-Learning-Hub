"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { activity1Intro, rememberActivity1Intro } from "./engine/workspaces";
import { gitEngine, useStudio, type CommandEvent } from "./WebContainerProvider";

type Step = { label: ReactNode; hint?: ReactNode; cmds?: string[]; done: boolean };

function RunPill({ cmd }: { cmd: string }) {
  const { runCommand, mode } = useStudio();
  return (
    <button type="button" disabled={mode === "booting"} onClick={() => void runCommand(cmd)} className="gs-cmd" title="Run it in the terminal below">
      {cmd}
    </button>
  );
}

/** A checklist that ticks itself as the student works in the studio below it. */
export function LiveChecklist({ title, minutes, intro, steps }: { title: string; minutes?: number; intro?: ReactNode; steps: Step[] }) {
  const current = steps.findIndex((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <section aria-label={title} className="gs-card mb-5 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="gs-heading text-xl font-semibold">
          {title}
          {minutes ? <span className="gs-ui ml-3 text-sm font-normal text-(--text-muted)">{minutes} mins</span> : null}
        </h3>
        <p className="gs-ui text-sm text-(--text-muted)" role="status">
          {doneCount === steps.length ? "✓ All done!" : `${doneCount} of ${steps.length} done`}
        </p>
      </div>
      {intro && <div className="mt-2 text-(--text-muted)">{intro}</div>}
      <ol className="mt-4 grid gap-2.5 md:grid-cols-2">
        {steps.map((step, i) => {
          const isCurrent = i === current;
          return (
            <li
              key={i}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-start gap-3 rounded border px-4 py-3 ${
                isCurrent
                  ? "border-(--accent-primary) bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-surface))]"
                  : step.done
                    ? "border-(--border-subtle) opacity-65"
                    : "border-(--border-subtle)"
              }`}
            >
              <span
                className={`gs-ui mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.done ? "bg-(--git-local) text-(--on-accent)" : isCurrent ? "bg-(--accent-primary) text-(--on-accent)" : "border border-(--border-subtle) text-(--text-muted)"
                }`}
                aria-hidden="true"
              >
                {step.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <p className="text-[15px]">
                  {step.label}
                  {step.done && <span className="sr-only"> (done)</span>}
                </p>
                {step.hint && !step.done && <p className="text-sm text-(--text-muted)">{step.hint}</p>}
                {step.cmds && !step.done && (
                  <div className="flex flex-wrap gap-1.5">
                    {step.cmds.map((c) => (
                      <RunPill key={c} cmd={c} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const ran = (commands: CommandEvent[], cmd: string, pred: (c: CommandEvent) => boolean = () => true) => commands.some((c) => c.cmd === cmd && c.code === 0 && pred(c));
const after = (facts: ReadonlyMap<string, number>, key: string) => facts.get(key) ?? Number.POSITIVE_INFINITY;

/** Earliest time any fact matching the test was first seen (Infinity when none has been). */
const firstAt = (facts: ReadonlyMap<string, number>, test: (key: string) => boolean) =>
  Math.min(Number.POSITIVE_INFINITY, ...[...facts].filter(([key]) => test(key)).map(([, at]) => at));

/** Activity 1 (slide 41): the basic Git command exercise, worded exactly as on the slide. */
export function Activity1Guide() {
  const { facts, commands, repo, repoRoot } = useStudio();
  const file = "my-project/your-name.txt";
  const committed = facts.has("commit:my-project");
  const repoAt = after(facts, "repo:my-project");
  const commitAt = after(facts, "commit:my-project");

  // Activity 2 starts from this introduction, so remember it once it is committed.
  const head = repo && repoRoot === "my-project" ? gitEngine.headId(repo) : null;
  const intro = head ? repo?.commits[head]?.files["your-name.txt"] : undefined;
  useEffect(() => {
    if (intro) rememberActivity1Intro(intro);
  }, [intro]);

  const steps: Step[] = [
    { label: <>Create a new folder called <code className="gs-pill">my-project</code></>, cmds: ["mkdir my-project"], done: facts.has("dir:my-project") },
    { label: <>Open the folder and type <code className="gs-pill">git init</code> in the terminal</>, cmds: ["cd my-project", "git init"], done: facts.has("repo:my-project") },
    {
      label: <>Create a new text file named <code className="gs-pill">your-name.txt</code></>,
      hint: <>Use New File above the editor, or type the command.</>,
      cmds: ["touch your-name.txt"],
      done: facts.has(`file:${file}`),
    },
    {
      label: <>Write a short self-introduction in the file and SAVE</>,
      hint: <>Type in the editor, then press Ctrl+S (Cmd+S on a Mac) or the Save button.</>,
      done: facts.has(`filled:${file}`) && (facts.has(`saved:${file}`) || facts.has(`staged:${file}`) || committed),
    },
    { label: <>Check the project status using <code className="gs-pill">git status</code></>, cmds: ["git status"], done: ran(commands, "status", (c) => c.root === "my-project" && c.at > repoAt) },
    { label: <>Add the file using <code className="gs-pill">git add .</code></>, cmds: ["git add ."], done: facts.has(`staged:${file}`) || committed },
    { label: <>Save your changes with <code className="gs-pill">git commit -m &quot;Initial commit&quot;</code></>, cmds: ['git commit -m "Initial commit"'], done: committed },
    { label: <>View the commit history using <code className="gs-pill">git log</code></>, cmds: ["git log"], done: ran(commands, "log", (c) => c.root === "my-project" && c.at > commitAt) },
  ];
  return (
    <LiveChecklist
      title="Slide checklist · 8 steps"
      intro={<p>Work through the steps in the terminal and editor below. Each step ticks itself when the sandbox sees it done.</p>}
      steps={steps}
    />
  );
}

/** Activity 2 (slide 68): branching and merging, worded exactly as on the slide. */
export function Activity2Guide() {
  const { facts, commands, repo } = useStudio();
  const [carried] = useState(() => activity1Intro() !== null);
  const isNewBranch = (prefix: string) => (key: string) => key.startsWith(prefix) && key !== `${prefix}main` && key !== `${prefix}master`;
  const madeAt = firstAt(facts, isNewBranch("branch:my-project:"));
  const onBranch = [...facts.keys()].some(isNewBranch("onbranch:my-project:"));
  const returnedAt = after(facts, "returned:my-project");
  const listedSince = (since: number) => ran(commands, "branch", (c) => c.args.length === 0 && c.root === "my-project" && c.at > since);
  const name = (repo && Object.keys(repo.branches).find((b) => b !== "main" && b !== "master")) ?? "hobby";
  const steps: Step[] = [
    { label: <>Create a new branch using <code className="gs-pill">git branch &lt;branch-name&gt;</code></>, cmds: ["git branch hobby"], done: Number.isFinite(madeAt) },
    { label: <>Check the list of branches using <code className="gs-pill">git branch</code></>, cmds: ["git branch"], done: listedSince(madeAt) },
    { label: <>Switch to the new branch using <code className="gs-pill">git checkout &lt;branch-name&gt;</code></>, cmds: [`git checkout ${name}`], done: onBranch },
    {
      label: (
        <>
          Add a line about your hobby in <code className="gs-pill">your-name.txt</code> (the file you have created in previous exercise) and save.
        </>
      ),
      hint: <>Type it in the editor, then press Ctrl+S (Cmd+S on a Mac) or the Save button.</>,
      done: facts.has("edited-on-branch:my-project") || facts.has("branchcommit:my-project"),
    },
    {
      label: (
        <>
          Commit the change using <code className="gs-pill">git add your-name.txt</code>, <code className="gs-pill">git commit -m &quot;add hobby in branch&quot;</code>
        </>
      ),
      cmds: ["git add your-name.txt", 'git commit -m "add hobby in branch"'],
      done: facts.has("branchcommit:my-project"),
    },
    {
      label: <>Switch back to the main branch using <code className="gs-pill">git checkout main/master</code></>,
      hint: <>Watch the editor: your hobby line disappears, because it only exists on your branch.</>,
      cmds: ["git checkout main"],
      done: facts.has("returned:my-project"),
    },
    { label: <>Check branches again using <code className="gs-pill">git branch</code> to confirm you are now on main.</>, cmds: ["git branch"], done: listedSince(returnedAt) },
  ];
  return (
    <LiveChecklist
      title="Slide checklist · 7 steps"
      intro={
        <p>
          The sandbox already has <code className="gs-pill">my-project</code> from Activity 1 on <code className="gs-pill">main</code>, with{" "}
          {carried ? (
            <>
              the <code className="gs-pill">your-name.txt</code> you wrote
            </>
          ) : (
            <>
              a sample <code className="gs-pill">your-name.txt</code>
            </>
          )}{" "}
          committed as &quot;Initial commit&quot;.
        </p>
      }
      steps={steps}
    />
  );
}

/** Full sandbox mission (Additional content A1). */
export function PortalGuide() {
  const { facts, serverUrl, repo } = useStudio();
  const branch = repo?.head ?? "main";
  const steps: Step[] = [
    { label: "Edit a file (type in the editor or insert a preset)", done: facts.has("dirty:portal") },
    { label: <>Stage it with <code className="gs-pill">git add .</code></>, cmds: ["git add ."], done: [...facts.keys()].some((k) => k.startsWith("staged:portal/")) || (repo?.order.length ?? 0) > 1 },
    { label: "Commit a snapshot (message box under the editor)", done: (repo?.order.length ?? 0) > 1 },
    { label: <>Push it to GitHub</>, cmds: [`git push origin ${branch}`], done: facts.has("pushed:portal") },
    { label: <>Run the site with <code className="gs-pill">npm run dev</code></>, done: Boolean(serverUrl) },
  ];
  return <LiveChecklist title="Your mission" steps={steps} />;
}

/** Additional content A2: stash, cherry-pick, revert and rebase. */
export function AdvancedGuide() {
  const { commands } = useStudio();
  const stashed = ran(commands, "stash", (c) => c.args.length === 0 || c.args[0] === "push");
  const steps: Step[] = [
    { label: <>Edit <code className="gs-pill">notes.md</code>, then shelve it with <code className="gs-pill">git stash</code></>, cmds: ["git stash"], done: stashed },
    { label: <>Bring it back with <code className="gs-pill">git stash pop</code></>, cmds: ["git stash pop"], done: ran(commands, "stash", (c) => c.args[0] === "pop") },
    {
      label: (
        <>
          On <code className="gs-pill">main</code>, copy the typo fix from the feature branch: <code className="gs-pill">git cherry-pick C3</code>
        </>
      ),
      cmds: ["git switch main", "git cherry-pick C3"],
      done: ran(commands, "cherry-pick"),
    },
    { label: <>Undo the agenda commit safely with <code className="gs-pill">git revert C1</code></>, cmds: ["git revert C1"], done: ran(commands, "revert") },
    {
      label: (
        <>
          Replay <code className="gs-pill">feature</code> on top of main: <code className="gs-pill">git switch feature</code> then <code className="gs-pill">git rebase main</code>
        </>
      ),
      cmds: ["git switch feature", "git rebase main"],
      done: ran(commands, "rebase"),
    },
  ];
  return <LiveChecklist title="Try it: advanced Git" steps={steps} intro={<p>Commit IDs like <code className="gs-pill">C3</code> work anywhere a hash would.</p>} />;
}

/** Activity 3: the branching game levels (blue/red branches, fast-forward, delete, remote sync). */
export const GAME_LEVELS = [
  {
    title: "Level 1 · Branch out",
    goal: "Make two branches, blue and red, and give each its own commit.",
    hints: ["git branch blue", "git switch blue", 'echo blue > blue.txt && git add . && git commit -m "blue work"', "git switch -c red main", 'echo red > red.txt && git add . && git commit -m "red work"'],
  },
  {
    title: "Level 2 · Fast-forward merge",
    goal: "blue is one commit ahead of main. Bring main up to blue with a fast-forward merge.",
    hints: ["git switch main", "git merge blue"],
  },
  {
    title: "Level 3 · Tidy up branches",
    goal: "blue is merged, so delete it with git branch -d. Then try deleting red: Git refuses, because red is not merged.",
    hints: ["git branch -d blue", "git branch -d red", "git branch"],
  },
  {
    title: "Level 4 · Remote sync",
    goal: "Clone the hackathon repo, let teammates push, then make your own commit, pull and push so GitHub has everyone's work.",
    hints: [
      "git clone https://github.com/SIMITClubAdmin/hackxperience.git",
      "cd hackxperience",
      "git fakeTeamwork main 2",
      'echo "my idea" >> faq.md && git commit -am "Add my idea"',
      "git pull",
      "git push",
    ],
  },
] as const;

export function gameLevelDone(level: number, ctx: ReturnType<typeof useStudio>) {
  const { repo, repoRoot, facts, commands } = ctx;
  if (level === 4) {
    if (repoRoot !== "hackxperience" || !repo) return false;
    const local = repo.branches.main;
    return facts.has("teammates:hackxperience") && facts.has("pushed:hackxperience") && repo.remote.main === local && gitEngine.trk(repo).main === local && ran(commands, "fakeTeamwork");
  }
  if (!repo || repoRoot !== "game") return false;
  const onMain = gitEngine.reachable(repo, repo.branches.main);
  if (level === 1) {
    const ok = (b: string) => Boolean(repo.branches[b]) && !onMain.has(repo.branches[b]);
    return ok("blue") && ok("red");
  }
  if (level === 2) return Boolean(repo.branches.blue) && repo.branches.main === repo.branches.blue;
  return !repo.branches.blue && Boolean(repo.branches.red);
}

export function GameGuide({ level, setLevel }: { level: number; setLevel: (n: number) => void }) {
  const studio = useStudio();
  const info = GAME_LEVELS[level - 1];
  const done = gameLevelDone(level, studio);
  return (
    <section aria-label="Branching game" className="gs-card mb-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="gs-heading text-xl font-semibold">Activity 3 · Branching game</h3>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Levels">
          {GAME_LEVELS.map((l, i) => (
            <button
              key={l.title}
              type="button"
              role="tab"
              aria-selected={level === i + 1}
              onClick={() => setLevel(i + 1)}
              className={`gs-btn ${level === i + 1 ? "border-(--accent-primary) text-(--accent-text)" : ""}`}
            >
              Level {i + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <p className="gs-heading text-lg font-semibold">{info.title}</p>
        <p className="text-(--text-muted)">{info.goal}</p>
        <details className="gs-details">
          <summary className="gs-ui flex items-center gap-1.5 text-sm text-(--accent-text)">
            Show the commands <ChevronDown className="gs-chevron size-4 transition-transform" aria-hidden="true" />
          </summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {info.hints.map((h) => (
              <RunPill key={h} cmd={h} />
            ))}
          </div>
        </details>
        <p role="status" className={`gs-ui text-sm font-bold ${done ? "text-(--git-local)" : "text-(--text-muted)"}`}>
          {done ? "✓ Level complete!" : "Goal not reached yet: the graph below shows where you are."}
        </p>
        {done && level < GAME_LEVELS.length && (
          <button type="button" onClick={() => setLevel(level + 1)} className="cta self-start">
            Next level
          </button>
        )}
      </div>
    </section>
  );
}
