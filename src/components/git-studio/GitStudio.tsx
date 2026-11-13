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
    </WebContainerProvider>
  );
}

function BarButton({ onClick, pressed, label, children }: { onClick: () => void; pressed?: boolean; label?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-mono text-[11px] tracking-wider uppercase transition-colors ${
        pressed
          ? "border-[#38bdf8]/70 bg-[#0f243c] text-[#38bdf8]"
          : "border-[#152238] bg-[#0b101e] text-[#94a3b8] hover:border-[#38bdf8] hover:text-[#f8fafc]"
      }`}
    >
      {children}
    </button>
  );
}

function CommandPill({ command, onRun }: { command: string; onRun: (command: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onRun(command)}
      className="rounded-sm border border-[#1e3a5f] bg-[#0f243c] px-1.5 py-0.5 font-mono text-[11px] text-[#38bdf8] hover:border-[#38bdf8]"
      title="Run in the terminal"
    >
      {command}
    </button>
  );
}

function StudioShell() {
  const { mode, repo, status, serverUrl, speed, setSpeed, reset, runCommand, commitMessage, updateFile, files, fallbackReason, startDevServer } =
    useStudio();
  const { expanded, toggleExpanded } = useTrackLayout();
  const cardRef = useRef<HTMLDivElement>(null);
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

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
  const run = (command: string) => void runCommand(command);
  const navbar = PRESETS[0];

  const goals = [
    {
      title: "Edit a file",
      hint: "Type in the editor, or drop in a component.",
      done: committed || changed,
      action: (
        <button
          type="button"
          onClick={() => updateFile(navbar.file, navbar.apply(files[navbar.file] ?? ""))}
          className="rounded-sm border border-[#1e3a5f] bg-[#0f243c] px-1.5 py-0.5 font-mono text-[11px] text-[#38bdf8] hover:border-[#38bdf8]"
        >
          {navbar.label}
        </button>
      ),
    },
    { title: "Stage it", hint: "Copy the changes into the packing box.", done: committed || status.staged.length > 0, action: <CommandPill command="git add ." onRun={run} /> },
    {
      title: "Commit a snapshot",
      hint: "Seal the box with your message.",
      done: committed,
      action: <CommandPill command={`git commit -m ${quoteMessage(commitMessage)}`} onRun={run} />,
    },
    { title: "Push to GitHub", hint: "Send the snapshot through the tunnel.", done: pushed, action: <CommandPill command={`git push origin ${branch}`} onRun={run} /> },
  ];

  const mission = [
    { label: "Edit file", done: goals[0].done },
    { label: "git add .", done: goals[1].done },
    { label: "git commit", done: goals[2].done },
    { label: "git push", done: goals[3].done },
    { label: "npm run dev", done: Boolean(serverUrl) },
  ];
  const currentStep = mission.findIndex((m) => !m.done);

  const dot =
    mode === "container"
      ? { color: "bg-[#10b981]", text: "WebContainer live" }
      : mode === "fallback"
        ? { color: "bg-[#a855f7]", text: "Built-in engine" }
        : { color: "bg-[#f59e0b]", text: "Booting" };

  return (
    <div
      ref={cardRef}
      data-speed={speed === 1 ? "normal" : "slow"}
      className={`gs-root w-full overflow-hidden rounded border border-[#152238] bg-[#070b14] shadow-[0_24px_80px_-32px_rgba(56,189,248,0.25)] ${fullscreen ? "!overflow-auto" : ""}`}
    >
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#152238] bg-[#0b101e] px-3 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="flex items-center gap-2" title={dot.text}>
            <span className={`gs-live-dot size-2.5 rounded-full ${dot.color}`} aria-hidden="true" />
            <span className="font-mono text-xs font-bold tracking-wider text-[#f8fafc]">
              GIT_WEBCONTAINER_STUDIO <span className="text-[#475569]">{"// v2.5"}</span>
            </span>
            <span className="sr-only">{dot.text}</span>
          </span>
          <ol className="flex flex-wrap items-center gap-1 rounded border border-[#152238] bg-[#070b14] px-2 py-1 font-mono text-[10.5px]" aria-label="Mission">
            {mission.map((step, i) => (
              <li key={step.label} className="flex items-center gap-1">
                {i > 0 && <span className="text-[#334155]" aria-hidden="true">→</span>}
                <span
                  aria-current={i === currentStep ? "step" : undefined}
                  className={
                    step.done
                      ? "text-[#10b981]"
                      : i === currentStep
                        ? "rounded-sm bg-[#38bdf8]/15 px-1 font-bold text-[#38bdf8]"
                        : "text-[#475569]"
                  }
                >
                  {step.done ? "✓" : `${i + 1}.`} {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <BarButton onClick={() => setGoalsOpen((v) => !v)} pressed={goalsOpen}>
            <Target className="size-3.5" aria-hidden="true" /> Goals
            <ChevronDown className={`size-3 transition-transform ${goalsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </BarButton>
          <div className="inline-flex overflow-hidden rounded border border-[#152238]" role="group" aria-label="Animation speed">
            {([1, 0.5] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={speed === s}
                onClick={() => setSpeed(s)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 font-mono text-[11px] tracking-wider uppercase ${
                  speed === s ? "bg-[#0f243c] text-[#38bdf8]" : "bg-[#0b101e] text-[#94a3b8] hover:text-[#f8fafc]"
                }`}
              >
                {s === 1 ? (
                  <>
                    <Gauge className="size-3.5" aria-hidden="true" /> 1x
                  </>
                ) : (
                  "0.5x Slow-Mo"
                )}
              </button>
            ))}
          </div>
          <BarButton onClick={reset} label="Reset sandbox">
            <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
          </BarButton>
          <BarButton onClick={toggleExpanded} pressed={expanded}>
            <ArrowLeftRight className="size-3.5" aria-hidden="true" /> {expanded ? "Show lessons" : "Expand studio"}
          </BarButton>
          <BarButton onClick={toggleFullscreen} pressed={fullscreen} label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="size-3.5" aria-hidden="true" /> : <Maximize2 className="size-3.5" aria-hidden="true" />}
          </BarButton>
        </div>
      </div>

      {goalsOpen && (
        <ol className="grid gap-px border-b border-[#152238] bg-[#152238] sm:grid-cols-2 xl:grid-cols-4" aria-label="Goal tracker">
          {goals.map((goal, i) => (
            <li key={goal.title} className={`flex items-start gap-3 px-3 py-2.5 ${goal.done ? "bg-[#06140f]" : "bg-[#070b14]"}`}>
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px] font-bold ${
                  goal.done ? "border-[#10b981] bg-[#10b981] text-[#070913]" : "border-[#334155] text-[#94a3b8]"
                }`}
                aria-hidden="true"
              >
                {goal.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className={`text-sm font-semibold ${goal.done ? "text-[#10b981]" : "text-[#f8fafc]"}`}>
                  {goal.title}
                  <span className="sr-only">{goal.done ? " (done)" : ""}</span>
                </p>
                <p className="text-xs text-[#64748b]">{goal.hint}</p>
                <div>{goal.action}</div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {mode === "fallback" && fallbackReason && (
        <p className="border-b border-[#a855f7]/30 bg-[#a855f7]/10 px-3 py-2 font-mono text-[11px] text-[#c4b5fd]" role="status">
          {fallbackReason}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col border-[#152238] xl:col-span-5 xl:border-r">
          <CodeEditorPane />
          <XtermTerminalPane />
          <PreviewDrawer />
        </div>
        <div className="flex min-w-0 flex-col border-t border-[#152238] xl:col-span-7 xl:border-t-0">
          <div className="border-b border-[#152238] p-3">
            <ThreeTreePipeline />
          </div>
          <GitDagVisualizer />
          <div className="flex flex-col gap-2 border-t border-[#152238] px-4 py-3 text-xs text-[#94a3b8]">
            <p className="font-mono text-[10.5px] tracking-wider text-[#64748b] uppercase">Try next</p>
            <p className="flex flex-wrap items-center gap-1.5">
              Branch off: <CommandPill command="git checkout -b feat-ui" onRun={run} /> then edit, commit and
              <CommandPill command="git push -u origin feat-ui" onRun={run} />
            </p>
            <p className="flex flex-wrap items-center gap-1.5">
              Bring it home: <CommandPill command="git switch main" onRun={run} />
              <CommandPill command="git merge feat-ui" onRun={run} />
              <span className="text-[#475569]">· change the same &lt;h1&gt; on both branches first to see a merge conflict</span>
            </p>
            <p className="flex flex-wrap items-center gap-1.5">
              Look around: <CommandPill command="git log --oneline --all" onRun={run} />
              <CommandPill command="git diff" onRun={run} />
              <CommandPill command="git help" onRun={run} />
              {!serverUrl && (
                <button type="button" onClick={() => void startDevServer()} className="font-mono text-[11px] text-[#f59e0b] hover:underline">
                  ▶ npm run dev
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
