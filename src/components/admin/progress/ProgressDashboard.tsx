"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { PageVeil } from "@/components/layout/PageVeil";
import { groupLabel } from "@/lib/groups";
import {
  byGroup,
  dailyCounts,
  inView,
  MAX_CORRECT,
  pct,
  STATUS_LABEL,
  summarize,
  TOTAL_STEPS,
  type DashboardMember,
  type MemberStatus,
  type MentorGroup,
} from "@/lib/progress-dashboard";
import { ChallengeGrid } from "./ChallengeGrid";
import { MembersTable } from "./MembersTable";
import { MentorGroupPicker } from "./MentorGroupPicker";
import { DonutRing, DonutWheel, Meter, Swatch, useTip, type WheelPart } from "./parts";
import { StepChart } from "./StepChart";
import { TimeChart } from "./TimeChart";

type View = "mine" | "all";

const STATUS_FILL: Record<MemberStatus, string> = {
  finished: "var(--pd-seq-5)",
  "in-progress": "var(--pd-seq-3)",
  "not-started": "hatch",
};

const STATUSES: MemberStatus[] = ["finished", "in-progress", "not-started"];

/**
 * The EXCO progress dashboard. "My groups" shows the groups the viewer mentors; "All subcomms"
 * shows every group except the testing group (8). The filter row scopes everything below it.
 */
export function ProgressDashboard({
  members,
  groups,
  view,
  now,
  demo = false,
}: {
  members: DashboardMember[];
  groups: MentorGroup[];
  view: View;
  /** The server's time, so the time graph's days are the same on the server and in the browser. */
  now: string;
  demo?: boolean;
}) {
  const [group, setGroup] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const myGroups = groups.filter((g) => g.mine);

  const scoped = members.filter((m) => inView(m, view));
  const q = query.trim().toLowerCase();
  const searched = q ? scoped.filter((m) => m.name.toLowerCase().includes(q)) : scoped;
  const filtered = group === null ? searched : searched.filter((m) => m.group === group);
  // While a filter applies, the charts keep their frame and fade instead of jumping.
  const shown = useDeferredValue(filtered);
  const stale = shown !== filtered;

  // The group cards: the viewer's groups (even empty ones), or every group that has members.
  const cardGroups =
    view === "mine"
      ? myGroups.map((g) => g.group_number).sort((a, b) => a - b)
      : [...new Set(scoped.map((m) => m.group).filter((g): g is number => g !== null))].sort((a, b) => a - b);
  const summary = summarize(shown);
  const viewHref = (v: View) => `/admin/progress?view=${v}${demo ? "&demo" : ""}`;
  const mentorLine = myGroups.length
    ? `You mentor ${myGroups.map((g) => `${groupLabel(g.group_number)} (${g.i_am_lead ? "lead" : "co-mentor"})`).join(" and ")}.`
    : "You don't mentor a group yet.";

  return (
    <main className="pd-root mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <PageVeil />
      {demo && (
        <p role="status" className="border border-accent bg-bg/90 px-4 py-2.5 text-sm">
          Demo data: made-up members, to preview this page. Nothing here is real, and nothing is saved.
        </p>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-xs tracking-wider text-accent uppercase">EXCO</p>
          <h1 className="text-4xl font-semibold">Progress dashboard</h1>
          <p className="text-dim">{mentorLine}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MentorGroupPicker groups={groups} demo={demo} />
          <Link href="/admin/results" className="text-sm text-ink underline underline-offset-4">
            Results per challenge
          </Link>
        </div>
      </header>

      {/* Filters: one row, above everything they scope. */}
      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="View" className="flex border border-violet">
          {(["mine", "all"] as const).map((v) => (
            <Link
              key={v}
              href={viewHref(v)}
              scroll={false}
              aria-current={view === v ? "page" : undefined}
              className={`px-3.5 py-2 text-sm ${view === v ? "bg-(--accent-primary) text-(--accent-on-primary)" : "text-dim hover:text-ink"}`}
            >
              {v === "mine" ? "My groups" : "All subcomms"}
            </Link>
          ))}
        </nav>
        {cardGroups.length > 1 && (
          <div role="group" aria-label="Group" className="flex flex-wrap gap-1.5">
            <Chip on={group === null} onClick={() => setGroup(null)}>
              All groups
            </Chip>
            {cardGroups.map((g) => (
              <Chip key={g} on={group === g} onClick={() => setGroup(group === g ? null : g)}>
                G{g}
              </Chip>
            ))}
          </div>
        )}
        <label className="relative flex items-center">
          <span className="sr-only">Search members</span>
          <Search className="pointer-events-none absolute left-2.5 size-4 text-dim" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a name"
            className="w-48 border border-violet bg-bg/85 py-2 pr-3 pl-8 text-sm text-ink"
          />
        </label>
        {(group !== null || q) && (
          <button
            type="button"
            onClick={() => {
              setGroup(null);
              setQuery("");
            }}
            className="flex items-center gap-1 text-sm text-dim hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      {view === "mine" && myGroups.length === 0 ? (
        <section className="flex flex-col items-start gap-3 border border-violet bg-bg/85 p-6">
          <h2 className="text-xl font-semibold">Choose the group you mentor</h2>
          <p className="text-dim">
            Once you choose a group, its members and their progress show here. You can still see everyone under{" "}
            <Link href={viewHref("all")} className="text-ink underline underline-offset-4">
              All subcomms
            </Link>
            .
          </p>
          <MentorGroupPicker groups={groups} demo={demo} />
        </section>
      ) : (
        <div className={`flex flex-col gap-6 transition-opacity ${stale ? "opacity-60" : ""}`}>
          {/* Headline numbers: one donut ring each. */}
          <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile>
              <DonutRing
                value={summary.count ? summary.opened / summary.count : 0}
                figure={`${summary.opened}`}
                label="Opened the hub"
                detail={`of ${summary.count} subcomms`}
              />
            </Tile>
            <Tile>
              <DonutRing
                value={summary.challengePct}
                figure={pct(summary.challengePct)}
                label="Challenge progress"
                detail={`avg ${summary.avgCorrect.toFixed(1)} of ${MAX_CORRECT} correct`}
              />
            </Tile>
            <Tile>
              <DonutRing
                value={summary.activityPct}
                figure={pct(summary.activityPct)}
                label="Activity progress"
                detail={`avg ${Math.round(summary.activityPct * TOTAL_STEPS)} of ${TOTAL_STEPS} steps`}
              />
            </Tile>
            <Tile>
              <DonutRing
                value={summary.count ? summary.finished / summary.count : 0}
                figure={`${summary.finished}`}
                label="Finished everything"
                detail={`of ${summary.count}: all challenges and activities`}
              />
            </Tile>
          </section>

          <GroupCards
            groups={cardGroups}
            members={searched}
            mentors={groups}
            selected={group}
            onSelect={(g) => setGroup(group === g ? null : g)}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <TimeChart days={dailyCounts(shown, now)} />
            <StepChart members={shown} />
          </div>
          <ChallengeGrid members={shown} />
          <MembersTable members={shown} />
        </div>
      )}
    </main>
  );
}

function Tile({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-center border border-violet bg-bg/85 px-3 py-5">{children}</div>;
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`border px-2.5 py-1.5 font-mono text-xs ${on ? "border-accent bg-(--accent-soft) text-ink" : "border-violet/60 text-dim hover:border-accent"}`}
    >
      {children}
    </button>
  );
}

/** One card per group: a donut wheel of who has finished, is in progress or hasn't started. */
function GroupCards({
  groups,
  members,
  mentors,
  selected,
  onSelect,
}: {
  groups: number[];
  members: DashboardMember[];
  mentors: MentorGroup[];
  selected: number | null;
  onSelect: (group: number) => void;
}) {
  const { box: tipBox, tip, layer: tipLayer } = useTip();
  const lists = new Map(byGroup(members).map((g) => [g.group, g.members]));
  if (groups.length === 0) return null;
  return (
    <section aria-labelledby="groups-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="groups-heading" className="text-lg font-semibold">
          Groups
        </h2>
        <p className="text-sm text-dim">Select a group to show only its members below.</p>
      </div>
      <div ref={tipBox} className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => {
          const list = lists.get(g) ?? [];
          const s = summarize(list);
          const parts: WheelPart[] = STATUSES.map((status) => ({
            key: status,
            label: STATUS_LABEL[status],
            count: s.byStatus[status].length,
            fill: STATUS_FILL[status],
            names: s.byStatus[status].map((m) => m.name),
          }));
          const on = selected === g;
          const mentorNames = mentors.find((m) => m.group_number === g)?.mentors ?? [];
          return (
            <article
              key={g}
              onClick={() => onSelect(g)}
              className={`flex min-w-0 cursor-pointer flex-col gap-4 border bg-bg/85 p-4 transition-colors ${on ? "border-accent" : "border-violet hover:border-accent/70"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <h3 className="font-semibold">{groupLabel(g)}</h3>
                  {mentorNames.length > 0 && <p className="truncate text-xs text-dim">Mentors: {mentorNames.join(", ")}</p>}
                </div>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(g);
                  }}
                  className={`shrink-0 border px-2 py-1 text-xs ${on ? "border-accent text-ink" : "border-violet/60 text-dim hover:border-accent"}`}
                >
                  {on ? "Showing" : "Show only"}
                </button>
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-dim">No subcomms in this group yet.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4">
                    <DonutWheel parts={parts} centre={`${s.count}`} centreLabel={s.count === 1 ? "member" : "members"} tip={tip} />
                    <ul className="flex flex-col gap-1.5 text-sm">
                      {parts.map((p) => (
                        <li key={p.key} className="flex items-center gap-2">
                          <Swatch fill={p.fill} />
                          <span className="text-dim">{p.label}</span>
                          <span className="font-mono text-ink">{p.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Meter value={s.challengePct} label="Challenges" figure={pct(s.challengePct)} />
                    <Meter value={s.activityPct} label="Activities" figure={pct(s.activityPct)} />
                  </div>
                </>
              )}
            </article>
          );
        })}
        {tipLayer}
      </div>
    </section>
  );
}
