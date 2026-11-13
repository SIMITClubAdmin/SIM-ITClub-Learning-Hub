"use client";

import { ArrowLeftRight, Check, ChevronDown, Gauge, Maximize2, Minimize2, RotateCcw, Target } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CodeEditorPane } from "./CodeEditorPane";
import { PRESETS } from "./engine/sandbox-files";
import { GitDagVisualizer } from "./GitDagVisualizer";
import { useTrackLayout } from "./GitTrackLayout";
import { PreviewDrawer } from "./PreviewDrawer";
import { ThreeTreePipeline } from "./ThreeTreePipeline";
import { quoteMessage, useStudio, WebContainerProvider } from "./WebContainerProvider";
import { XtermTerminalPane } from "./XtermTerminalPane";

export default function GitStudio() {
  return (
    <WebContainerProvider>
      <StudioShell />
      <BonusChallenges />
    </WebContainerProvider>
  );
}

function Cmd({ command, label, disabled }: { command: string; label?: string; disabled?: boolean }) {
  const { runCommand } = useStudio();
  return (
    <button type="button" disabled={disabled} onClick={() => void runCommand(command)} className="gs-cmd" title="Run it in the terminal">
      {label ?? command}
    </button>
  );
}

type Goal = { title: string; hint: string; done: boolean; action: ReactNode };

function GoalCard({ goal, index, current }: { goal: Goal; index: number; current: boolean }) {
  return (
    <li
      aria-current={current ? "step" : undefined}
      className={`flex flex-col gap-3 rounded border p-5 transition-colors ${
        current
          ? "border-(--accent-primary) bg-[color-mix(in_srgb,var(--accent-primary)_8%,var(--bg-surface))] shadow-[0_0_0_1px_var(--accent-primary)]"
          : goal.done
            ? "border-(--border-subtle) bg-(--bg-surface) opacity-60"
            : "border-(--border-subtle) bg-(--bg-surface)"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`gs-ui flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            goal.done
              ? "bg-(--git-local) text-(--on-accent)"
              : current
                ? "bg-(--accent-primary) text-(--on-accent)"
                : "border border-(--border-subtle) text-(--text-muted)"
          }`}
          aria-hidden="true"
        >
          {goal.done ? <Check className="size-4" /> : index + 1}
        </span>
        <p className="gs-heading text-base font-semibold">
          {index + 1}. {goal.title}
          {goal.done && <span className="sr-only"> (done)</span>}
          {current && <span className="sr-only"> (current step)</span>}
        </p>
      </div>
      <p className="text-sm text-(--text-muted)">{goal.hint}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2">{goal.action}</div>
    </li>
  );
}

function StudioShell() {
  const { mode, repo, status, speed, setSpeed, reset, runCommand, commitMessage, setCommitMessage, updateFile, files, fallbackReason } = useStudio();
  const { expanded, toggleExpanded } = useTrackLayout();
  const cardRef = useRef<HTMLDivElement>(null);
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const live = mode !== "booting";

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === cardRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void cardRef.current?.requestFullscreen?.();
  };

  const branch = repo.detached ? "main" : repo.head;
  const committed = repo.order.length > 1;
  const changed = status.unstaged.length + status.untracked.length + status.staged.length > 0;
  const pushed = Object.values(repo.remote).some((id) => id !== "C0");
  const navbar = PRESETS[0];

  const goals: Goal[] = [
    {
      title: "Edit a file",
      hint: "Change anything in the editor, or insert ready-made code.",
      done: committed || changed,
      action: (
        <button
          type="button"
          disabled={!live}
          onClick={() => updateFile(navbar.file, navbar.apply(files[navbar.file] ?? ""))}
          className="gs-btn"
        >
          Insert a navbar
        </button>
      ),
    },
    {
      title: "Stage it",
      hint: "Pack your changes into the staging area.",
      done: committed || status.staged.length > 0,
      action: <Cmd command="git add ." disabled={!live} />,
    },
    {
      title: "Commit a snapshot",
      hint: "Seal the staged changes with a message.",
      done: committed,
      action: (
        <form
          className="flex w-full min-w-0 flex-col items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void runCommand(`git commit -m ${quoteMessage(commitMessage)}`);
          }}
        >
          <input
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            maxLength={72}
            spellCheck={false}
            aria-label="Commit message"
            className="gs-code w-full min-w-0 rounded border border-(--border-subtle) bg-(--code-bg) px-2.5 py-1.5 text-[13px] text-(--code-text) outline-none focus:border-(--accent-primary)"
          />
          <button type="submit" disabled={!live} className="gs-cmd">
            git commit
          </button>
        </form>
      ),
    },
    {
      title: "Push to GitHub",
      hint: "Send your commits to the remote and watch them travel.",
      done: pushed,
      action: <Cmd command={`git push origin ${branch}`} disabled={!live} />,
    },
  ];
  const currentStep = goals.findIndex((g) => !g.done);

  const dot =
    mode === "container"
      ? { color: "bg-(--git-local)", text: "Sandbox live" }
      : mode === "fallback"
        ? { color: "bg-(--git-remote)", text: "Built-in engine" }
        : { color: "bg-(--git-modified)", text: "Starting…" };

  return (
    <div
      ref={cardRef}
      data-speed={speed === 1 ? "normal" : "slow"}
      className={`gs-root w-full overflow-hidden rounded border border-(--border-subtle) bg-(--bg-surface) shadow-[0_24px_80px_-40px_var(--accent-primary)] ${
        fullscreen ? "!overflow-auto" : ""
      }`}
    >
      {/* Header: title on the left, utilities on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-subtle) bg-(--bg-panel) px-5 py-3">
        <p className="flex items-center gap-2.5">
          <span className={`gs-live-dot size-2.5 rounded-full ${dot.color}`} aria-hidden="true" />
          <span className="gs-ui text-sm font-bold tracking-wide">
            GIT_WEBCONTAINER_STUDIO <span className="font-normal text-(--text-faint)">{"// v2.5"}</span>
          </span>
          <span className="gs-ui text-[13px] text-(--text-muted)">· {dot.text}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setGoalsOpen((v) => !v)} aria-pressed={goalsOpen} className="gs-btn">
            <Target className="size-4" aria-hidden="true" /> Goals
          </button>
          <div className="inline-flex overflow-hidden rounded border border-(--border-subtle)" role="group" aria-label="Animation speed">
            {([1, 0.5] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={speed === s}
                onClick={() => setSpeed(s)}
                className={`gs-ui inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] ${
                  speed === s ? "bg-[color-mix(in_srgb,var(--accent-primary)_16%,var(--bg-surface))] text-(--accent-soft)" : "bg-(--bg-surface) text-(--text-muted) hover:text-(--text-main)"
                }`}
              >
                {s === 1 ? (
                  <>
                    <Gauge className="size-4" aria-hidden="true" /> 1x
                  </>
                ) : (
                  "0.5x Slow-Mo"
                )}
              </button>
            ))}
          </div>
          <button type="button" onClick={reset} className="gs-btn">
            <RotateCcw className="size-4" aria-hidden="true" /> Reset
          </button>
          <button type="button" onClick={toggleExpanded} aria-pressed={expanded} className="gs-btn">
            <ArrowLeftRight className="size-4" aria-hidden="true" /> {expanded ? "Show lessons" : "Expand studio"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={fullscreen}
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="gs-btn px-2"
          >
            {fullscreen ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* The four steps are the one place to drive the lesson from. */}
      {goalsOpen && (
        <ol className="grid gap-4 border-b border-(--border-subtle) p-5 sm:grid-cols-2 xl:grid-cols-4" aria-label="Your mission">
          {goals.map((goal, i) => (
            <GoalCard key={goal.title} goal={goal} index={i} current={i === currentStep} />
          ))}
        </ol>
      )}

      {mode === "fallback" && fallbackReason && (
        <p className="border-b border-(--border-subtle) bg-[color-mix(in_srgb,var(--git-remote)_10%,var(--bg-surface))] px-5 py-2.5 text-sm text-(--text-muted)" role="status">
          {fallbackReason}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col border-(--border-subtle) xl:col-span-5 xl:border-r">
          <CodeEditorPane />
          <XtermTerminalPane />
          <PreviewDrawer />
        </div>
        <div className="flex min-w-0 flex-col border-t border-(--border-subtle) xl:col-span-7 xl:border-t-0">
          <div className="border-b border-(--border-subtle) p-5">
            <ThreeTreePipeline />
          </div>
          <GitDagVisualizer />
        </div>
      </div>
    </div>
  );
}

/** Extra practice for students who finished the four steps. Collapsed so beginners can ignore it. */
function BonusChallenges() {
  const { mode } = useStudio();
  const off = mode === "booting";
  const challenges: { title: string; body: ReactNode }[] = [
    {
      title: "Work on a branch",
      body: (
        <>
          <Cmd command="git checkout -b feat-ui" disabled={off} /> then edit and commit, then <Cmd command="git push -u origin feat-ui" disabled={off} />
          <span className="text-(--text-muted)">GitHub prints a link to open a pull request.</span>
        </>
      ),
    },
    {
      title: "Bring it home",
      body: (
        <>
          <Cmd command="git switch main" disabled={off} /> then <Cmd command="git merge feat-ui" disabled={off} />
        </>
      ),
    },
    {
      title: "Cause (and fix) a merge conflict",
      body: (
        <span className="text-(--text-muted)">
          Change the same <code className="gs-pill">&lt;h1&gt;</code> line on both branches, merge, fix the{" "}
          <code className="gs-pill">&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> markers in the editor, then <code className="gs-pill">git add index.html</code> and{" "}
          <code className="gs-pill">git commit</code>.
        </span>
      ),
    },
    {
      title: "Look around",
      body: (
        <>
          <Cmd command="git log --oneline --all" disabled={off} /> <Cmd command="git diff" disabled={off} /> <Cmd command="git help" disabled={off} />
        </>
      ),
    },
  ];

  return (
    <details className="gs-details gs-card mt-4">
      <summary className="flex items-center justify-between gap-3 px-5 py-4">
        <span className="gs-heading text-base font-semibold">Bonus challenges</span>
        <span className="flex items-center gap-2 text-sm text-(--text-muted)">
          Branches, merges and conflicts
          <ChevronDown className="gs-chevron size-4 transition-transform" aria-hidden="true" />
        </span>
      </summary>
      <ol className="grid gap-4 border-t border-(--border-subtle) p-5 md:grid-cols-2">
        {challenges.map((c, i) => (
          <li key={c.title} className="flex flex-col gap-2.5 rounded border border-(--border-subtle) bg-(--bg-panel) p-5">
            <p className="gs-heading font-semibold">
              {i + 1}. {c.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">{c.body}</div>
          </li>
        ))}
      </ol>
    </details>
  );
}
