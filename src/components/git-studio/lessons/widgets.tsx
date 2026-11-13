"use client";

import { useState, type ReactNode } from "react";
import { GatedCmd } from "../activity-gate";

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

const LETTER_STAGES = [
  {
    cmd: "",
    title: "Drafting on your desk",
    text: "Three pages sit on your notepad: your working directory. Cross things out and rewrite freely; nothing is sealed yet.",
  },
  {
    cmd: "git add",
    title: "Putting the pages into the envelope",
    text: "git add slides the finished pages into the open envelope: the staging area. You can still add or take out pages before you seal it.",
  },
  {
    cmd: "git commit",
    title: "Sealing and stamping the envelope",
    text: 'git commit seals the envelope, stamps it and labels the front "feat: add letter pages". It is now a permanent snapshot, kept safe in your local outbox: the local repository.',
  },
  {
    cmd: "git push",
    title: "Dropping it into the postbox",
    text: "git push drops the sealed envelope into the postbox, and the postal service delivers it to the central mailbox, GitHub, where your whole team can read it.",
  },
];

const PAGES = ["page-1", "page-2", "page-3"];
const LETTER_LABEL = "feat: add letter pages";

/** An envelope: open with pages poking out, or sealed with a wax stamp. */
function Envelope({ sealed, pages = 0, animate = false }: { sealed: boolean; pages?: number; animate?: boolean }) {
  return (
    <svg viewBox="0 -2 120 86" className="w-28 overflow-visible text-(--text-muted)" aria-hidden="true">
      {!sealed && <path d="M6 30 L60 2 L114 30 Z" fill="var(--bg-elevated)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />}
      <rect x="6" y="30" width="108" height="52" rx="3" fill="var(--bg-elevated)" stroke="currentColor" strokeWidth="1.5" />
      {!sealed &&
        Array.from({ length: pages }, (_, i) => (
          <g key={i} className={animate ? "gs-letter-move" : undefined} style={animate ? { animationDelay: `${i * 140}ms` } : undefined}>
            <rect x={26 + i * 10} y={12 + i * 4} width="48" height="40" rx="1.5" fill="#fdfcf7" stroke="#94a3b8" strokeWidth="1" />
            <path d={`M${32 + i * 10} ${20 + i * 4} h34 M${32 + i * 10} ${26 + i * 4} h30 M${32 + i * 10} ${32 + i * 4} h26`} stroke="#94a3b8" strokeWidth="1.2" />
          </g>
        ))}
      {/* The front pocket covers the bottom of the pages. */}
      <path d="M6 30 L60 60 L114 30 V82 H6 Z" fill="var(--bg-surface)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {sealed && (
        <>
          <path className={animate ? "gs-flap-close" : undefined} d="M6 30 L60 60 L114 30 Z" fill="var(--bg-elevated)" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <g className={animate ? "gs-seal-stamp" : undefined}>
            <circle cx="60" cy="58" r="9" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1.2" />
            <path d="M55.5 58 l3 3 l6 -6.5" fill="none" stroke="#fee2e2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </>
      )}
    </svg>
  );
}

function PostZone({ icon, title, sub, tone, active, children }: { icon: string; title: string; sub: string; tone: string; active: boolean; children: ReactNode }) {
  return (
    <div
      className="flex min-h-48 min-w-0 flex-col gap-3 rounded border bg-(--bg-panel) p-3.5 transition-colors"
      style={{ borderColor: active ? tone : "var(--border-subtle)", boxShadow: active ? `0 0 0 1px ${tone}` : undefined }}
    >
      <div>
        <p className="gs-ui text-xs font-bold tracking-wider uppercase" style={{ color: tone }}>
          <span aria-hidden="true">{icon}</span> {title}
        </p>
        <p className="gs-ui text-[11px] tracking-wider text-(--text-muted) uppercase">{sub}</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">{children}</div>
    </div>
  );
}

function PostArrow({ cmd }: { cmd: string }) {
  return (
    <span className="gs-code hidden items-center self-center text-xs whitespace-nowrap text-(--accent-text) @3xl:flex" aria-hidden="true">
      {cmd} →
    </span>
  );
}

/** Lesson 02: Git as writing and posting a letter. git add, git commit and git push unlock in order. */
export function LetterPost() {
  const [stage, setStage] = useState(0);
  const s = LETTER_STAGES[stage];
  return (
    <div className="gs-card flex flex-col gap-5 p-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Run a command, in order">
        {LETTER_STAGES.slice(1).map((st, i) => (
          <GatedCmd
            key={st.cmd}
            label={st.cmd}
            state={stage > i ? "done" : stage === i ? "ready" : "locked"}
            glow
            onRun={() => setStage(i + 1)}
            title={stage === i ? `Run ${st.cmd}` : stage > i ? "Done" : `Run ${LETTER_STAGES[i].cmd} first`}
          />
        ))}
        <button type="button" onClick={() => setStage(0)} className="gs-btn">
          Start again
        </button>
      </div>

      {/* Sized by the card's own width: a row of four with arrows when there is room, else a 2 by 2 grid. */}
      <div className="@container" aria-hidden="true">
      <div className="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        <PostZone icon="📝" title="Your desk" sub="Working directory" tone="var(--git-modified)" active={stage === 0}>
          {stage === 0 ? (
            <ul className="flex flex-col items-center gap-1.5">
              {PAGES.map((page, i) => (
                <li
                  key={page}
                  className="gs-file-in gs-code rounded-sm border border-slate-300 bg-[#fdfcf7] px-2.5 py-1 text-xs text-slate-800 shadow-sm"
                  style={{ rotate: `${[-2, 1.5, -1][i]}deg` }}
                >
                  📝 {page}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-(--text-faint)">Desk clear</p>
          )}
        </PostZone>
        <PostArrow cmd="git add" />
        <PostZone icon="✉️" title="Envelope" sub="Staging area" tone="var(--git-local)" active={stage === 1}>
          {stage <= 1 ? (
            <>
              <Envelope sealed={false} pages={stage === 1 ? 3 : 0} animate={stage === 1} />
              <p className="text-xs text-(--text-muted)">{stage === 1 ? "3 pages inside, flap still open" : "Open and empty"}</p>
            </>
          ) : (
            <p className="text-sm text-(--text-faint)">Sealed and moved on</p>
          )}
        </PostZone>
        <PostArrow cmd="git commit" />
        <PostZone icon="🔏" title="Sealed outbox" sub="Local repository" tone="var(--accent-text)" active={stage === 2}>
          {stage === 2 && (
            <div className="gs-letter-move flex flex-col items-center gap-2">
              <Envelope sealed animate />
              <span className="gs-code max-w-full truncate rounded-sm bg-(--accent-primary) px-1.5 text-[11px] text-(--on-accent)">&quot;{LETTER_LABEL}&quot;</span>
            </div>
          )}
          {stage === 3 && (
            <p className="text-xs text-(--text-muted)">
              📒 Logbook: <span className="gs-code text-(--text-main)">{LETTER_LABEL}</span> (sent)
            </p>
          )}
          {stage < 2 && <p className="text-sm text-(--text-faint)">Empty</p>}
        </PostZone>
        <PostArrow cmd="git push" />
        <PostZone icon="📮" title="GitHub postbox" sub="Remote" tone="var(--git-remote)" active={stage === 3}>
          {stage === 3 ? (
            <>
              <div className="gs-letter-fly">
                <Envelope sealed />
              </div>
              <p className="gs-delivered text-sm font-semibold text-(--git-local)">✓ Delivered to GitHub</p>
              <p className="gs-delivered text-xs text-(--text-muted)">Your whole team can read it now.</p>
            </>
          ) : (
            <p className="text-sm text-(--text-faint)">Waiting for mail</p>
          )}
        </PostZone>
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
