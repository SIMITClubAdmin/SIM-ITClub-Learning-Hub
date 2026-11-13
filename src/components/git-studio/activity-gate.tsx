"use client";

import { Check, Lock } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";

/**
 * Step-by-step activities (Activity 1 and 2) gate the studio's command buttons: a button only
 * works while the current step needs its command. Outside an activity there is no gate.
 */
export type ActivityGate = {
  /** Every command the activity uses, in step order. The terminal toolbar shows these. */
  commands: string[];
  /** Commands the current step needs right now. */
  ready: Set<string>;
  /** Commands from steps already finished. */
  done: Set<string>;
  /** The step (1-based) each command first belongs to, for its tooltip. */
  stepOf: Map<string, number>;
};

export type CmdState = "ready" | "locked" | "done";

/** A step's command: a plain string, or one that waits on something within the step. */
export type StepCmd = string | { cmd: string; locked?: boolean; done?: boolean };

export const normCmd = (c: StepCmd) => (typeof c === "string" ? { cmd: c, locked: false, done: false } : { locked: false, done: false, ...c });

export const GateContext = createContext<ActivityGate | null>(null);

export function useGate() {
  return useContext(GateContext);
}

/** Works out which commands are open, from the activity's steps (the first unfinished one is current). */
export function buildGate(steps: { cmds?: StepCmd[]; done: boolean }[]): ActivityGate {
  const current = steps.findIndex((s) => !s.done);
  const gate: ActivityGate = { commands: [], ready: new Set(), done: new Set(), stepOf: new Map() };
  steps.forEach((step, i) => {
    for (const { cmd, locked, done } of (step.cmds ?? []).map(normCmd)) {
      if (!gate.stepOf.has(cmd)) {
        gate.commands.push(cmd);
        gate.stepOf.set(cmd, i + 1);
      }
      if (i === current && !locked && !done) gate.ready.add(cmd);
      else if (current === -1 || i < current || (i === current && done)) gate.done.add(cmd);
    }
  });
  return gate;
}

export function cmdState(gate: ActivityGate | null, cmd: string): CmdState {
  if (!gate || gate.ready.has(cmd)) return "ready";
  return gate.done.has(cmd) ? "done" : "locked";
}

/** The open command that starts with prefix ("git commit"...), the fallback when there is no gate, or null when locked. */
export function readyCommand(gate: ActivityGate | null, prefix: string, fallback: string) {
  if (!gate) return fallback;
  return [...gate.ready].find((c) => c.startsWith(prefix)) ?? null;
}

/**
 * A command button. Locked ones show a padlock, finished ones a tick, and a newly opened one
 * glows (glow) so the student sees what just became available.
 */
export function GatedCmd({
  label,
  state,
  onRun,
  disabled,
  glow,
  title,
  className = "",
}: {
  label: ReactNode;
  state: CmdState;
  onRun: () => void;
  disabled?: boolean;
  glow?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-state={state}
      data-glow={glow && state === "ready" ? "" : undefined}
      disabled={disabled || state !== "ready"}
      onClick={onRun}
      title={title}
      className={`gs-cmd ${className}`}
    >
      {state === "locked" && <Lock className="size-3 shrink-0" aria-hidden="true" />}
      {state === "done" && <Check className="size-3 shrink-0" aria-hidden="true" />}
      {label}
      {state === "locked" && <span className="sr-only"> (locked until its step)</span>}
      {state === "done" && <span className="sr-only"> (done)</span>}
    </button>
  );
}

/** Tooltip for a gated toolbar button. */
export function gateTitle(gate: ActivityGate, cmd: string) {
  const step = gate.stepOf.get(cmd);
  const state = cmdState(gate, cmd);
  if (state === "ready") return "Run it in the terminal";
  if (state === "done") return `Done in step ${step}`;
  return `Unlocks at step ${step}`;
}
