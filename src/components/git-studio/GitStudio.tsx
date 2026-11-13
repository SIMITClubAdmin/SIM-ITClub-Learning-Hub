"use client";

import { ChevronDown, Gauge, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { GatedCmd, readyCommand, useGate } from "./activity-gate";
import { CodeEditorPane } from "./CodeEditorPane";
import type { StudioVariant } from "./engine/workspaces";
import { GitDagVisualizer } from "./GitDagVisualizer";
import { PreviewDrawer } from "./PreviewDrawer";
import { Activity1Guide, Activity2Guide, AdvancedGuide, GameGuide, PortalGuide } from "./StudioGuides";
import { ThreeTreePipeline } from "./ThreeTreePipeline";
import { useStudio, WebContainerProvider } from "./WebContainerProvider";
import { XtermTerminalPane } from "./XtermTerminalPane";

export type StudioKind = "portal" | "activity1" | "activity2" | "game" | "advanced";

export default function GitStudio({ kind }: { kind: StudioKind }) {
  const [level, setLevel] = useState(1);
  const variant: StudioVariant = kind === "game" ? (`game${level}` as StudioVariant) : kind;
  return (
    // A new level is a fresh workspace, so the provider remounts with its key.
    <WebContainerProvider key={variant} variant={variant}>
      {/* Activities 1 and 2 wrap the studio: its command buttons open one step at a time. */}
      {kind === "activity1" ? (
        <Activity1Guide>
          <StudioShell />
        </Activity1Guide>
      ) : kind === "activity2" ? (
        <Activity2Guide>
          <StudioShell />
        </Activity2Guide>
      ) : (
        <>
          {kind === "game" && <GameGuide level={level} setLevel={setLevel} />}
          {kind === "advanced" && <AdvancedGuide />}
          {kind === "portal" && <PortalGuide />}
          <StudioShell />
          {kind === "portal" && <BonusChallenges />}
        </>
      )}
    </WebContainerProvider>
  );
}

function StudioShell() {
  const { mode, speed, setSpeed, reset, fallbackReason } = useStudio();
  const [expanded, setExpanded] = useState(false);

  // Escape leaves the expanded view (the preview theater handles its own Escape first).
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector(".gs-theater")) setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const dot =
    mode === "container"
      ? { color: "bg-(--git-local)", text: "Sandbox live" }
      : mode === "fallback"
        ? { color: "bg-(--git-remote)", text: "Built-in engine" }
        : { color: "bg-(--git-modified)", text: "Starting…" };

  return (
    <div
      data-speed={speed === 1 ? "normal" : "slow"}
      role={expanded ? "dialog" : undefined}
      aria-label={expanded ? "Git studio, expanded" : undefined}
      className={`gs-root w-full overflow-hidden rounded border border-(--border-subtle) bg-(--bg-surface) shadow-[0_24px_80px_-40px_var(--accent-primary)] ${expanded ? "gs-expanded" : ""}`}
    >
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-(--border-subtle) bg-(--bg-panel) px-5 py-3">
        <p className="flex items-center gap-2.5">
          <span className={`gs-live-dot size-2.5 rounded-full ${dot.color}`} aria-hidden="true" />
          <span className="gs-ui text-sm font-bold tracking-wide">
            GIT_WEBCONTAINER_STUDIO <span className="font-normal text-(--text-faint)">{"// v3"}</span>
          </span>
          <span className="gs-ui text-[13px] text-(--text-muted)">· {dot.text}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded border border-(--border-subtle)" role="group" aria-label="Animation speed">
            {([1, 0.5] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={speed === s}
                onClick={() => setSpeed(s)}
                className={`gs-ui inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] ${
                  speed === s ? "bg-[color-mix(in_srgb,var(--accent-primary)_16%,var(--bg-surface))] text-(--accent-text)" : "bg-(--bg-surface) text-(--text-muted) hover:text-(--text-main)"
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
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-pressed={expanded} className="gs-btn">
            {expanded ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
            {expanded ? "Exit expanded view" : "⇄ Expand studio"}
          </button>
        </div>
      </div>

      {mode === "fallback" && fallbackReason && (
        <p className="border-b border-(--border-subtle) bg-[color-mix(in_srgb,var(--git-remote)_10%,var(--bg-surface))] px-5 py-2.5 text-sm text-(--text-muted)" role="status">
          {fallbackReason}
        </p>
      )}

      {/* Top: what Git sees. Middle: the code. Bottom: the terminal and preview. */}
      <div className="border-b border-(--border-subtle) p-5">
        <GuidedActionBar />
        <ThreeTreePipeline />
      </div>
      <GitDagVisualizer />
      <div className="border-t border-(--border-subtle)">
        <CodeEditorPane />
      </div>
      <XtermTerminalPane />
      <PreviewDrawer />
    </div>
  );
}

function GuidedActionBar() {
  const { runCommand, mode } = useStudio();
  const gate = useGate();
  const actions = [
    { label: "1. Edit a file", prefix: "", command: null },
    { label: "2. Stage it · git add .", prefix: "git add", command: "git add ." },
    { label: "3. Commit a snapshot", prefix: "git commit", command: 'git commit -m "Workshop save point"' },
    { label: "4. Push to GitHub", prefix: "git push", command: "git push" },
  ];
  return (
    <ol className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Git workflow">
      {actions.map((action) => {
        // In an activity, an action only opens when the current step needs that kind of command.
        const run = action.command ? readyCommand(gate, action.prefix, action.command) : null;
        return (
          <li key={action.label} className="min-w-0">
            {action.command ? (
              <GatedCmd
                label={action.label}
                state={run ? "ready" : "locked"}
                glow={!!gate}
                disabled={mode === "booting"}
                onRun={() => {
                  if (run) void runCommand(run);
                }}
                title={run ? `Runs ${run}` : "Opens when a step needs it"}
                className="w-full justify-start"
              />
            ) : (
              <span className="flex min-h-9 items-center rounded border border-(--border-subtle) bg-(--bg-panel) px-3 text-[13px] text-(--text-muted)">{action.label}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Cmd({ command }: { command: string }) {
  const { runCommand, mode } = useStudio();
  return (
    <button type="button" disabled={mode === "booting"} onClick={() => void runCommand(command)} className="gs-cmd" title="Run it in the terminal">
      {command}
    </button>
  );
}

/** Extra practice for students who finished the mission. Collapsed so beginners can ignore it. */
function BonusChallenges() {
  const challenges: { title: string; body: ReactNode }[] = [
    {
      title: "Work on a branch",
      body: (
        <>
          <Cmd command="git switch -c feat-ui" /> then edit and commit, then <Cmd command="git push -u origin feat-ui" />
          <span className="text-(--text-muted)">GitHub prints a link to open a pull request.</span>
        </>
      ),
    },
    {
      title: "Bring it home",
      body: (
        <>
          <Cmd command="git switch main" /> then <Cmd command="git merge feat-ui" />
        </>
      ),
    },
    {
      title: "Teammates pushed too",
      body: (
        <>
          <Cmd command="git fakeTeamwork main 2" /> then try <Cmd command="git push" /> (rejected!), <Cmd command="git pull" /> and push again.
        </>
      ),
    },
    {
      title: "Look around",
      body: (
        <>
          <Cmd command="git log --oneline --all" /> <Cmd command="git diff" /> <Cmd command="git help" />
        </>
      ),
    },
  ];

  return (
    <details className="gs-details gs-card mt-4">
      <summary className="flex items-center justify-between gap-3 px-5 py-4">
        <span className="gs-heading text-base font-semibold">Bonus challenges</span>
        <span className="flex items-center gap-2 text-sm text-(--text-muted)">
          Branches, teamwork and history
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
