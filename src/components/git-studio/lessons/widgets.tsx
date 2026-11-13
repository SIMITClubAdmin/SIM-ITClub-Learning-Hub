"use client";

import { useState } from "react";

const SAVE_POINTS = [
  { day: "Mon", message: "Create homepage", nav: false, footer: false, form: false },
  { day: "Tue", message: "Add navbar", nav: true, footer: false, form: false },
  { day: "Wed", message: "Fix footer link", nav: true, footer: true, form: false },
  { day: "Thu", message: "Add contact form", nav: true, footer: true, form: true },
];

/** Slide 9: each dot is a snapshot of the whole project; click one to "jump back" to it. */
export function SavePointTimeline() {
  const [at, setAt] = useState(SAVE_POINTS.length - 1);
  const point = SAVE_POINTS[at];
  return (
    <div className="gs-card flex flex-col gap-6 p-6">
      <ol className="relative grid grid-cols-4 gap-2" aria-label="Save points">
        <span className="absolute top-4 right-[12.5%] left-[12.5%] h-0.5 bg-(--border-subtle)" aria-hidden="true" />
        {SAVE_POINTS.map((p, i) => {
          const active = i === at;
          const past = i <= at;
          return (
            <li key={p.message} className="relative flex flex-col items-center gap-2 text-center">
              <button
                type="button"
                onClick={() => setAt(i)}
                aria-pressed={active}
                aria-label={`Jump to save point ${i + 1}: ${p.message}`}
                className={`gs-ui z-10 flex size-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-transform hover:scale-110 ${
                  active ? "border-(--accent-primary) bg-(--accent-primary) text-(--on-accent)" : past ? "border-(--git-local) bg-(--bg-surface) text-(--git-local)" : "border-(--border-subtle) bg-(--bg-surface) text-(--text-faint)"
                }`}
              >
                {i + 1}
              </button>
              <span className={`text-sm font-semibold ${past ? "text-(--text-main)" : "text-(--text-faint)"}`}>{p.message}</span>
              <span className="gs-ui text-xs text-(--text-muted)">
                {p.day}
                {i === SAVE_POINTS.length - 1 ? " (you are here)" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr] md:items-center">
        <p className="text-base text-(--text-muted)">
          Something broke? <strong className="text-(--text-main)">Jump back to any save point.</strong> You are looking at the project as it was after
          <span className="text-(--accent-text)"> “{point.message}”</span> on {point.day}.
        </p>
        <div className="overflow-hidden rounded border border-(--border-subtle) bg-white text-[13px] text-slate-800 shadow-sm" aria-label="The homepage at this save point">
          {point.nav && <div className="flex gap-3 bg-slate-800 px-3 py-1.5 text-white">Home · Events · Join</div>}
          <div className="px-4 py-3">
            <p className="text-base font-bold">SIM ITClub</p>
            <p>Workshops, hackathons and friends who build things.</p>
            {point.form && (
              <div className="mt-2 flex gap-2">
                <span className="flex-1 rounded border border-slate-300 px-2 py-1 text-slate-400">your@email.com</span>
                <span className="rounded bg-violet-600 px-2 py-1 text-white">Send</span>
              </div>
            )}
          </div>
          {point.footer ? <div className="border-t border-slate-200 px-3 py-1 text-violet-700">Find us on GitHub ↗</div> : <div className="border-t border-slate-200 px-3 py-1 text-red-600">Find us on GitHub (broken link)</div>}
        </div>
      </div>
    </div>
  );
}

const STAGES = [
  { cmd: "", title: "Changes on the concourse", text: "You edited three files. They are people waiting in the station, not on the platform yet." },
  { cmd: "git add", title: "Choosing who gets on the platform", text: "git add lets the changes you choose onto the platform, ready to board." },
  { cmd: "git commit", title: "Putting people on the train and closing the doors", text: 'git commit puts everyone on the platform onto the train, closes the doors and labels it: "Login feature added".' },
  { cmd: "git push", title: "Sending the train to the destination", text: "git push sends the train from your local station to the remote station, GitHub. Now everyone can see the changes." },
];

/** Slides 20-24: the MRT analogy as a three-button stepper. */
export function MrtTrain() {
  const [stage, setStage] = useState(0);
  const s = STAGES[stage];
  const people = ["🧑", "👩", "🧑‍🎓"];
  return (
    <div className="gs-card flex flex-col gap-5 p-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Run a command">
        {STAGES.slice(1).map((st, i) => (
          <button key={st.cmd} type="button" onClick={() => setStage(i + 1)} disabled={stage !== i} className="gs-cmd">
            {st.cmd}
          </button>
        ))}
        <button type="button" onClick={() => setStage(0)} className="gs-btn">
          Start again
        </button>
      </div>
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-end gap-3 overflow-hidden rounded border border-(--border-subtle) bg-(--bg-panel) p-4" aria-hidden="true">
        <div className="flex flex-col gap-2">
          <p className="gs-ui text-xs tracking-wider text-(--git-local) uppercase">Local station · Lavender EW11</p>
          <div className="flex h-9 items-end gap-1 text-2xl">{stage === 0 && people.map((p, i) => <span key={i}>{p}</span>)}</div>
          <div className="flex h-9 items-end gap-1 border-t-4 border-(--border-subtle) pt-1 text-2xl">{stage === 1 && people.slice(0, 2).map((p, i) => <span key={i}>{p}</span>)}</div>
          <p className="gs-ui text-[11px] text-(--text-muted)">platform</p>
        </div>
        <div
          className="flex flex-col items-center gap-1 transition-transform duration-1000 ease-in-out"
          style={{ transform: stage === 3 ? "translateX(140%)" : "translateX(0)" }}
        >
          <span className="gs-ui max-w-[10rem] truncate rounded-sm bg-(--accent-primary) px-1.5 text-[11px] text-(--on-accent)">{stage >= 2 ? '"Login feature added"' : "empty train"}</span>
          <span className="flex items-center gap-1 rounded border-2 border-(--accent-primary) bg-(--bg-surface) px-2 py-1 text-2xl">
            🚆{stage >= 2 && people.slice(0, 2).map((p, i) => <span key={i}>{p}</span>)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="gs-ui text-right text-xs tracking-wider text-(--git-remote) uppercase">Remote station · GitHub</p>
          <div className="flex h-9 items-end gap-1 text-2xl">{stage === 3 && people.slice(0, 2).map((p, i) => <span key={i}>{p}</span>)}</div>
        </div>
      </div>
      <div role="status">
        <p className="gs-heading text-lg font-semibold">
          {s.cmd && <code className="gs-pill mr-2">{s.cmd}</code>}
          {s.title}
        </p>
        <p className="mt-1 text-base text-(--text-muted)">{s.text}</p>
      </div>
    </div>
  );
}

const CURRENT = "Hello world!";
const INCOMING = "Hello ITC!";

/** Slides 77-82: a VS Code style conflict you can actually resolve. */
export function ConflictResolver() {
  const [choice, setChoice] = useState<null | "current" | "incoming" | "both">(null);
  const resolved = choice === "current" ? [CURRENT] : choice === "incoming" ? [INCOMING] : choice === "both" ? [CURRENT, INCOMING] : null;
  return (
    <div className="overflow-hidden rounded border border-(--border-subtle) bg-(--code-bg)">
      <p className="gs-ui border-b border-(--border-subtle) bg-(--bg-panel) px-4 py-2 text-xs tracking-wider text-(--text-muted) uppercase">part1.txt · VS Code</p>
      <div className="gs-code px-4 py-3 text-sm leading-7">
        <div className="text-(--code-text)">Hello my name is Michelle.</div>
        {resolved ? (
          resolved.map((line) => (
            <div key={line} className="gs-file-in text-(--git-local)">
              {line}
            </div>
          ))
        ) : (
          <>
            <div className="flex flex-wrap gap-x-2 text-xs text-(--text-faint)">
              <button type="button" onClick={() => setChoice("current")} className="underline-offset-2 hover:text-(--accent-text) hover:underline">
                Accept Current Change
              </button>
              |
              <button type="button" onClick={() => setChoice("incoming")} className="underline-offset-2 hover:text-(--accent-text) hover:underline">
                Accept Incoming Change
              </button>
              |
              <button type="button" onClick={() => setChoice("both")} className="underline-offset-2 hover:text-(--accent-text) hover:underline">
                Accept Both Changes
              </button>
            </div>
            <div className="bg-[color-mix(in_srgb,var(--git-local)_14%,transparent)] text-(--code-text)">
              {"<<<<<<< HEAD"} <span className="text-(--text-faint)">(Current Change)</span>
            </div>
            <div className="bg-[color-mix(in_srgb,var(--git-local)_14%,transparent)] text-(--code-text)">{CURRENT}</div>
            <div className="text-(--text-faint)">=======</div>
            <div className="bg-[color-mix(in_srgb,var(--lane-2)_16%,transparent)] text-(--code-text)">{INCOMING}</div>
            <div className="bg-[color-mix(in_srgb,var(--lane-2)_16%,transparent)] text-(--code-text)">
              {">>>>>>> branch-b"} <span className="text-(--text-faint)">(Incoming Change)</span>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--border-subtle) bg-(--bg-panel) px-4 py-2.5 text-sm" role="status">
        {resolved ? (
          <>
            <span className="text-(--git-local)">
              Resolved. Next: <kbd className="gs-pill">Ctrl + S</kbd> → <code className="gs-pill">git add .</code> → <code className="gs-pill">git commit -m &quot;merge conflict&quot;</code>
            </span>
            <button type="button" onClick={() => setChoice(null)} className="gs-btn">
              Try again
            </button>
          </>
        ) : (
          <span className="text-(--text-muted)">Click one of the actions above the conflict, like you would in VS Code.</span>
        )}
      </div>
    </div>
  );
}
