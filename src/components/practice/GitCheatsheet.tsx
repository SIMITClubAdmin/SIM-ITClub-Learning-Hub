"use client";

import { Fragment, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { InlineCode } from "@/components/practice/InlineCode";
import {
  BRANCH_COMMANDS,
  CHEAT_TABS,
  CONFLICT_MARKERS,
  DESKTOP_ROWS,
  GOLDEN_RULE,
  MERGE_COMMANDS,
  PR_DIRECTION,
  RESOLVE_STEPS,
  SETUP_COMMANDS,
  type CheatCommand,
  type CheatTab,
} from "@/lib/git-cheatsheet";

/* ---------- Saved preference: open or closed, above or beside the questions ----------
   Kept per browser, so it stays the same from one challenge to the next. */

type Layout = "above" | "beside";
type Prefs = { open: boolean; layout: Layout };

const PREFS_KEY = "itcamp-git-cheatsheet";
const DEFAULT_PREFS: Prefs = { open: false, layout: "beside" };
let prefs: Prefs | null = null;
const listeners = new Set<() => void>();

function readPrefs(): Prefs {
  if (prefs) return prefs;
  prefs = DEFAULT_PREFS;
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null");
    if (saved && typeof saved.open === "boolean" && (saved.layout === "above" || saved.layout === "beside")) {
      prefs = { open: saved.open, layout: saved.layout };
    }
  } catch {
    // Storage blocked or unreadable: use the defaults.
  }
  return prefs;
}

function savePrefs(next: Prefs) {
  prefs = next;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    // Not saved, but the choice still applies until the page is reloaded.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const usePrefs = () => useSyncExternalStore(subscribe, readPrefs, () => DEFAULT_PREFS);

/* ---------- Look: theme tokens only, so every palette and font applies ---------- */

const PILL = "bg-(--accent-soft) px-1.5 py-0.5 font-mono text-[0.85em] text-(--accent-text) [overflow-wrap:anywhere]";
const SMALL_BUTTON = "border px-2.5 py-1 font-mono text-xs tracking-wider uppercase";

function Rich({ text }: { text: string }) {
  return <InlineCode text={text} codeClassName={PILL} />;
}

/**
 * The page frame for a Git challenge: the "All challenges" link with the cheatsheet button
 * beside it, then the questions. The questions (children) always sit in the same place in the
 * tree, so opening, closing or moving the cheatsheet never resets an answer in progress.
 */
export function GitCheatsheetFrame({
  back,
  veil,
  startTab,
  children,
}: {
  back: ReactNode;
  veil: ReactNode;
  startTab: CheatTab;
  children: ReactNode;
}) {
  const { open, layout } = usePrefs();
  const [tab, setTab] = useState<CheatTab>(startTab);
  const [floating, setFloating] = useState(false);
  const [barInView, setBarInView] = useState(true);
  const [panelInView, setPanelInView] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const beside = open && layout === "beside";

  // The floating pill shows only once the button bar has scrolled away and the open
  // cheatsheet (if any) is out of view too.
  useEffect(() => {
    const watch = (el: Element | null, set: (v: boolean) => void) => {
      if (!el || typeof IntersectionObserver === "undefined") return null;
      const observer = new IntersectionObserver(([entry]) => set(entry.isIntersecting));
      observer.observe(el);
      return observer;
    };
    const observers = [watch(barRef.current, setBarInView), watch(panelRef.current, setPanelInView)];
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  // Escape closes the floating cheatsheet and hands focus back to the pill.
  useEffect(() => {
    if (!floating) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setFloating(false);
      pillRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [floating]);

  const showPill = !barInView && !(open && panelInView);

  return (
    // Beside the questions needs more room, so the page widens on extra-large screens.
    <main className={`mx-auto w-full flex-1 px-4 py-3 sm:px-8 ${beside ? "max-w-5xl xl:max-w-[96rem]" : "max-w-5xl"}`}>
      {veil}
      <div ref={barRef} className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => savePrefs({ open: !open, layout })}
          className={`border px-3.5 py-2 font-mono text-sm tracking-wider uppercase transition-colors ${
            open
              ? "border-(--accent-primary) bg-(--accent-primary) text-(--accent-on-primary)"
              : "border-(--border-accent) bg-(--accent-soft) text-(--accent-text) hover:border-(--accent-primary)"
          }`}
        >
          <span aria-hidden="true">📖 </span>Git Cheatsheet
        </button>
      </div>

      <div className={`mt-3 ${beside ? "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] xl:items-start xl:gap-6" : ""}`}>
        {/* Above the questions, or a sticky column beside them on extra-large screens. */}
        <section
          ref={panelRef}
          id={panelId}
          hidden={!open}
          aria-label="Git command cheatsheet"
          className={
            beside
              ? "mb-6 xl:sticky xl:top-4 xl:order-2 xl:mb-0 xl:flex xl:max-h-[calc(100svh-2rem)] xl:flex-col"
              : "mb-6"
          }
        >
          <Cheatsheet
            tab={tab}
            onTab={setTab}
            layout={layout}
            onLayout={(next) => savePrefs({ open, layout: next })}
            onClose={() => savePrefs({ open: false, layout })}
            bodyClass={beside ? "max-h-[60svh] xl:max-h-none" : "max-h-[60svh]"}
          />
        </section>
        <div className="flex min-w-0 flex-col gap-6 xl:order-1">{children}</div>
      </div>

      {showPill && (
        <button
          ref={pillRef}
          type="button"
          onClick={() => setFloating(true)}
          aria-haspopup="dialog"
          className="fixed right-4 bottom-4 z-20 border border-(--border-accent) bg-(--bg-elevated) px-3.5 py-2 font-mono text-xs tracking-wider text-(--accent-text) uppercase shadow-lg hover:border-(--accent-primary)"
        >
          <span aria-hidden="true">📖 </span>Cheatsheet
        </button>
      )}

      {floating && (
        <div
          role="dialog"
          aria-label="Git command cheatsheet"
          className="fixed right-4 bottom-4 z-40 flex max-h-[75svh] w-[min(30rem,calc(100vw-2rem))] flex-col shadow-2xl"
        >
          <Cheatsheet
            tab={tab}
            onTab={setTab}
            onClose={() => {
              setFloating(false);
              pillRef.current?.focus();
            }}
            autoFocusClose
            bodyClass=""
          />
        </div>
      )}
    </main>
  );
}

/** The cheatsheet itself: header, section tabs and the chosen section. */
function Cheatsheet({
  tab,
  onTab,
  layout,
  onLayout,
  onClose,
  autoFocusClose = false,
  bodyClass,
}: {
  tab: CheatTab;
  onTab: (tab: CheatTab) => void;
  layout?: Layout;
  onLayout?: (layout: Layout) => void;
  onClose: () => void;
  autoFocusClose?: boolean;
  /** Height limit for the scrolling body. */
  bodyClass: string;
}) {
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys, Home and End move between tabs, as in any tab list.
  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = CHEAT_TABS.findIndex((t) => t.id === tab);
    const last = CHEAT_TABS.length - 1;
    const next =
      e.key === "ArrowRight" ? (i + 1) % CHEAT_TABS.length : e.key === "ArrowLeft" ? (i + last) % CHEAT_TABS.length : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    onTab(CHEAT_TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  const shows = (id: CheatTab) => tab === "all" || tab === id;

  return (
    <div className="flex min-h-0 flex-1 flex-col border border-(--border-accent) bg-(--bg-surface) text-(--text-main)">
      <div className="flex items-center justify-between gap-3 border-b border-(--border-subtle) bg-(--bg-elevated) px-4 py-3">
        <h2 className="text-lg font-semibold">
          <span aria-hidden="true">📖 </span>Git command cheatsheet
        </h2>
        <div className="flex items-center gap-2">
          {layout && onLayout && (
            <div role="group" aria-label="Where the cheatsheet sits" className="hidden gap-1 xl:flex">
              {(["above", "beside"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={layout === option}
                  onClick={() => onLayout(option)}
                  className={`${SMALL_BUTTON} ${
                    layout === option
                      ? "border-(--border-accent) bg-(--accent-soft) text-(--accent-text)"
                      : "border-(--border-subtle) text-(--text-muted) hover:text-(--text-main)"
                  }`}
                >
                  {option === "above" ? "Above" : "Beside"}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            // Only the floating sheet takes focus when it opens.
            autoFocus={autoFocusClose}
            aria-label="Close the cheatsheet"
            className={`${SMALL_BUTTON} border-(--border-subtle) text-(--text-muted) hover:border-(--border-accent) hover:text-(--text-main)`}
          >
            ✕
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Cheatsheet sections"
        onKeyDown={onTabKey}
        className="flex flex-wrap gap-1.5 border-b border-(--border-subtle) px-4 py-3"
      >
        {CHEAT_TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${uid}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => onTab(t.id)}
            className={`border px-2.5 py-1 text-left text-sm ${
              tab === t.id
                ? "border-(--border-accent) bg-(--accent-soft) text-(--accent-text)"
                : "border-(--border-subtle) text-(--text-muted) hover:border-(--border-accent) hover:text-(--text-main)"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel`}
        aria-labelledby={`${uid}-tab-${tab}`}
        tabIndex={0}
        className={`flex min-h-0 flex-col gap-6 overflow-y-auto px-4 py-4 ${bodyClass}`}
      >
        {shows("desktop") && <DesktopTable />}
        {shows("c1") && <CommandList title="Challenge 1 · Setup & core workflow" commands={SETUP_COMMANDS} />}
        {shows("c2") && <CommandList title="Challenge 2 · Branching & switching" commands={BRANCH_COMMANDS} />}
        {shows("c3") && <MergeSection />}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-mono text-xs tracking-wider text-(--accent-text) uppercase">{children}</h3>;
}

function DesktopTable() {
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>CLI vs. GitHub Desktop · slide summary</SectionTitle>
      <div className="overflow-x-auto border border-(--border-subtle)">
        <table className="w-full text-left text-sm">
          <thead className="bg-(--bg-elevated) font-mono text-xs tracking-wider text-(--text-muted) uppercase">
            <tr>
              <th scope="col" className="p-2">
                Action
              </th>
              <th scope="col" className="p-2">
                Terminal (CLI)
              </th>
              <th scope="col" className="p-2">
                GitHub Desktop
              </th>
            </tr>
          </thead>
          <tbody>
            {DESKTOP_ROWS.map(([action, cli, desktop]) => (
              <tr key={action} className="border-t border-(--border-subtle) align-top">
                <th scope="row" className="p-2 font-semibold whitespace-nowrap">
                  {action}
                </th>
                <td className="p-2">
                  <Rich text={cli} />
                </td>
                <td className="p-2 text-(--text-muted)">{desktop}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-l-4 border-(--accent-primary) bg-(--accent-soft) px-3 py-2 text-sm">
        <strong className="text-(--accent-text)">Golden rule:</strong> {GOLDEN_RULE}
      </p>
    </section>
  );
}

function Commands({ commands }: { commands: CheatCommand[] }) {
  return (
    <ul className="flex flex-col divide-y divide-(--border-subtle)">
      {commands.map((c) => (
        <li key={c.cmds.join("|")} className="py-2">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {c.cmds.map((cmd, i) => (
              <Fragment key={cmd}>
                {i > 0 && <span className="text-xs text-(--text-muted)">or</span>}
                <code className={PILL}>{cmd}</code>
              </Fragment>
            ))}
          </p>
          <p className="mt-1 text-sm text-(--text-muted)">
            <Rich text={c.does} />
          </p>
        </li>
      ))}
    </ul>
  );
}

function CommandList({ title, commands }: { title: string; commands: CheatCommand[] }) {
  return (
    <section className="flex flex-col gap-1">
      <SectionTitle>{title}</SectionTitle>
      <Commands commands={commands} />
    </section>
  );
}

function MergeSection() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <SectionTitle>Challenge 3 · Merging, PRs & conflicts</SectionTitle>
        <Commands commands={MERGE_COMMANDS} />
      </div>

      <div>
        <p className="text-sm font-semibold">Pull request direction on GitHub</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-2">
          <code className={PILL}>{PR_DIRECTION.base}</code>
          <span aria-hidden="true">←</span>
          <span className="sr-only">pulls in</span>
          <code className={PILL}>{PR_DIRECTION.compare}</code>
        </p>
        <p className="mt-1 text-sm text-(--text-muted)">
          <Rich text={PR_DIRECTION.means} />
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold">Merge conflict markers</p>
        <dl className="mt-1.5 flex flex-col gap-1.5 text-sm">
          {CONFLICT_MARKERS.map(([marker, meaning]) => (
            <div key={marker} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
              <dt className="shrink-0">
                <code className={`${PILL} whitespace-pre`}>{marker}</code>
              </dt>
              <dd className="text-(--text-muted)">
                <Rich text={meaning} />
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <p className="text-sm font-semibold">After editing the file to resolve it</p>
        <ol className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {RESOLVE_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">→</span>}
              <span>
                {i + 1}. <Rich text={step} />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
