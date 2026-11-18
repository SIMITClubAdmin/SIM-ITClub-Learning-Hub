"use client";

import { Check, ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
import { ACTIVITIES, stepWord } from "@/lib/activities";
import { formatDateTime } from "@/lib/format";
import { groupLabel } from "@/lib/groups";
import { CHALLENGE_SLUGS, MAX_CORRECT, pct, STATUS_LABEL, type DashboardMember } from "@/lib/progress-dashboard";
import { MAX_ATTEMPTS } from "@/lib/quiz-meta";
import { Card, Meter } from "./parts";

type SortKey = "name" | "group" | "overall" | "correct" | "lastActive";

const COLUMNS: { key: SortKey | null; label: string; className?: string }[] = [
  { key: "name", label: "Member" },
  { key: "group", label: "Group" },
  { key: "overall", label: "Overall" },
  { key: "correct", label: "Correct answers" },
  { key: null, label: "Activities" },
  { key: "lastActive", label: "Last active" },
];

function compare(a: DashboardMember, b: DashboardMember, key: SortKey) {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "group":
      return (a.group ?? 99) - (b.group ?? 99) || (a.seat ?? 99) - (b.seat ?? 99);
    case "overall":
      return a.overallPct - b.overallPct;
    case "correct":
      return a.correct - b.correct;
    case "lastActive":
      return (a.lastActive ?? "").localeCompare(b.lastActive ?? "");
  }
}

/** Every member in the filter, sortable; a row opens to show each challenge and activity step. */
export function MembersTable({ members }: { members: DashboardMember[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "group", dir: 1 });
  const [open, setOpen] = useState<string | null>(null);
  const sorted = [...members].sort((a, b) => compare(a, b, sort.key) * sort.dir);
  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" || key === "group" ? 1 : -1 }));

  return (
    <Card title="Members" description="Select a column to sort. Open a row for each challenge and activity step.">
      {sorted.length === 0 ? (
        <p className="text-sm text-dim">Nobody to show for this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">Members&apos; progress</caption>
            <thead className="font-mono text-xs tracking-wider text-dim uppercase">
              <tr className="border-b border-violet/60">
                <th scope="col" className="w-8 p-2">
                  <span className="sr-only">Details</span>
                </th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.label}
                    scope="col"
                    className="p-2 font-normal"
                    aria-sort={c.key && sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
                  >
                    {c.key ? (
                      <button type="button" onClick={() => toggleSort(c.key!)} className="flex items-center gap-1 uppercase hover:text-ink">
                        {c.label}
                        <span aria-hidden="true" className={sort.key === c.key ? "text-ink" : "opacity-30"}>
                          {sort.key === c.key && sort.dir === -1 ? "↓" : "↑"}
                        </span>
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const isOpen = open === m.id;
                const detailId = `member-${m.id}`;
                return (
                  <Fragment key={m.id}>
                    <tr className={`border-b border-grid align-middle ${m.openedHub ? "" : "text-dim"} ${isOpen ? "bg-(--accent-soft)" : "hover:bg-(--accent-soft)"}`}>
                      <td className="p-2">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={detailId}
                          aria-label={`${isOpen ? "Hide" : "Show"} ${m.name}'s details`}
                          onClick={() => setOpen(isOpen ? null : m.id)}
                          className="flex size-7 items-center justify-center border border-violet/60 hover:border-accent"
                        >
                          <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                        </button>
                      </td>
                      <td className="p-2">
                        <span className="font-semibold text-ink">{m.name}</span>
                        <span className="block text-xs text-dim">{m.openedHub ? STATUS_LABEL[m.status] : "Hasn't opened the hub yet"}</span>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {m.group ? groupLabel(m.group) : "None"}
                        {m.seat ? <span className="text-xs text-dim"> · {m.seat}</span> : null}
                      </td>
                      <td className="w-36 p-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Meter compact value={m.overallPct} label={`${m.name}: overall progress`} figure={pct(m.overallPct)} />
                          </div>
                          <span className="w-10 text-right font-mono">{pct(m.overallPct)}</span>
                        </div>
                      </td>
                      <td className="p-2 font-mono whitespace-nowrap">
                        {m.correct} <span className="text-dim">/ {MAX_CORRECT}</span>
                        <span className="block text-xs text-dim">
                          {m.challengesDone}/{CHALLENGE_SLUGS.length} challenges
                        </span>
                      </td>
                      <td className="w-48 p-2">
                        <div className="flex flex-col gap-1">
                          {ACTIVITIES.map((a) => {
                            const done = m.activities.find((x) => x.id === a.id)?.done ?? 0;
                            return (
                              <div key={a.id} className="flex items-center gap-2">
                                <span className="w-6 font-mono text-[11px] text-dim">A{a.title.slice(-1)}</span>
                                <div className="flex-1">
                                  <Meter compact value={done / a.steps} label={`${m.name}: ${a.title}`} figure={`${done} of ${a.steps}`} />
                                </div>
                                <span className="w-8 text-right font-mono text-xs">
                                  {done}/{a.steps}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-2 text-xs whitespace-nowrap text-dim">{m.lastActive ? formatDateTime(m.lastActive) : "-"}</td>
                    </tr>
                    {isOpen && (
                      <tr id={detailId} className="border-b border-grid bg-(--accent-soft)">
                        <td />
                        <td colSpan={COLUMNS.length} className="p-3">
                          <MemberDetail member={m} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function MemberDetail({ member }: { member: DashboardMember }) {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_2fr]">
      <div className="flex flex-col gap-2">
        <h3 className="font-mono text-xs tracking-wider text-dim uppercase">Challenges</h3>
        <ul className="flex flex-col gap-1">
          {member.quizzes.map((q) => (
            <li key={q.slug} className="flex justify-between gap-3">
              <span>{q.label}</span>
              <span className="shrink-0 font-mono text-dim">
                {q.best === null ? "not attempted" : `${q.best} / ${q.outOf}`} · {q.attempts}/{MAX_ATTEMPTS}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {ACTIVITIES.map((a) => {
          const record = member.activities.find((x) => x.id === a.id);
          return (
            <div key={a.id} className="flex flex-col gap-2">
              <h3 className="font-mono text-xs tracking-wider text-dim uppercase">
                {a.title} · {record?.done ?? 0}/{a.steps}
              </h3>
              <ol className="flex flex-col gap-1">
                {a.stepNames.map((name, i) => {
                  const done = record?.steps.find((s) => s.step === i + 1);
                  return (
                    <li key={name} className={`flex items-start gap-1.5 ${done ? "" : "text-dim"}`}>
                      {done ? (
                        <Check className="mt-0.5 size-3.5 shrink-0 text-(--accent-text)" aria-label="Done" />
                      ) : (
                        <span aria-label="Not yet" className="mt-1.5 inline-block size-2 shrink-0 rounded-full border border-current" />
                      )}
                      <span className="flex flex-col">
                        <span>
                          {stepWord(a)} {i + 1}: {name}
                        </span>
                        {done && <span className="text-xs text-dim">{formatDateTime(done.doneAt)}</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );
}
