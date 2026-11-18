"use client";

import { useState, type KeyboardEvent } from "react";
import { groupLabel } from "@/lib/groups";
import { byGroup, CHALLENGE_SLUGS, type DashboardMember } from "@/lib/progress-dashboard";
import { MAX_ATTEMPTS, QUIZ_INFO, quizLabel } from "@/lib/quiz-meta";
import { Card, DataTable, TipLines, useTip } from "./parts";

/** Score ÷ questions → one of five steps of the accent, faint to full. */
function shade(best: number, outOf: number) {
  const r = outOf ? best / outOf : 0;
  const step = Math.min(5, Math.max(1, Math.ceil(r * 5)));
  return `var(--pd-seq-${step})`;
}

const SCALE = [
  { label: "0–20%", fill: "var(--pd-seq-1)" },
  { label: "21–40%", fill: "var(--pd-seq-2)" },
  { label: "41–60%", fill: "var(--pd-seq-3)" },
  { label: "61–80%", fill: "var(--pd-seq-4)" },
  { label: "81–100%", fill: "var(--pd-seq-5)" },
];

/** Short column heads: "HTML", "MC1"... with the full name on hover. */
const shortName = (slug: string) => (QUIZ_INFO[slug]?.mini ? `MC${QUIZ_INFO[slug].mini}` : QUIZ_INFO[slug]?.title ?? slug);

/**
 * Members (rows, by group) × challenges (columns). Each cell is the best attempt's share of
 * correct answers; hatched means not attempted. One cell takes focus at a time: the arrow keys
 * move it, and its tooltip shows as it would on hover.
 */
export function ChallengeGrid({ members }: { members: DashboardMember[] }) {
  const { box: tipBox, tip, layer: tipLayer } = useTip();
  const [cursor, setCursor] = useState({ row: 0, col: 0 });
  const groups = byGroup(members);
  const rows = groups.flatMap((g) => g.members);
  const cols = CHALLENGE_SLUGS.length;

  const cellTip = (m: DashboardMember, slug: string) => {
    const q = m.quizzes.find((x) => x.slug === slug)!;
    return (
      <TipLines
        value={q.best === null ? "Not attempted" : `${q.best} / ${q.outOf}`}
        label={`${m.name} · ${quizLabel(slug)}`}
        extra={q.best === null ? undefined : `${q.attempts} of ${MAX_ATTEMPTS} attempts used`}
      />
    );
  };

  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const d = deltas[e.key];
    if (!d) return;
    e.preventDefault();
    const row = Math.max(0, Math.min(rows.length - 1, cursor.row + d[0]));
    const col = Math.max(0, Math.min(cols - 1, cursor.col + d[1]));
    setCursor({ row, col });
    const el = e.currentTarget.querySelector<HTMLElement>(`[data-cell="${row}-${col}"]`);
    el?.focus();
  };

  return (
    <Card
      title="Challenge grid"
      description="Each member's best attempt at each challenge. The stronger the colour, the more correct answers."
      table={
        <DataTable
          caption="Best score per member and challenge"
          head={["Member", ...CHALLENGE_SLUGS.map(quizLabel)]}
          rows={rows.map((m) => [
            `${m.name}${m.group ? ` (G${m.group})` : ""}`,
            ...m.quizzes.map((q) => (q.best === null ? "-" : `${q.best}/${q.outOf}`)),
          ])}
        />
      }
    >
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dim" aria-label="Colour scale">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="pd-hatch inline-block size-3 rounded-sm" /> Not attempted
        </li>
        {SCALE.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ background: s.fill }} /> {s.label}
          </li>
        ))}
      </ul>
      {rows.length === 0 ? (
        <p className="text-sm text-dim">Nobody to show for this filter.</p>
      ) : (
        <div ref={tipBox} className="relative">
          <div className="overflow-x-auto">
            <div role="grid" aria-label="Best score per member and challenge" aria-rowcount={rows.length + 1} onKeyDown={move} className="min-w-[30rem]">
              <div role="row" className="grid items-end gap-0.5 pb-1" style={{ gridTemplateColumns: `minmax(9rem, 1.4fr) repeat(${cols}, minmax(2.75rem, 1fr))` }}>
                <span role="columnheader" className="text-xs text-dim">
                  Member
                </span>
                {CHALLENGE_SLUGS.map((slug) => (
                  <span key={slug} role="columnheader" title={quizLabel(slug)} className="text-center font-mono text-[11px] text-dim">
                    {shortName(slug)}
                  </span>
                ))}
              </div>
              {groups.map((g) => (
                <div key={g.group ?? "none"} role="rowgroup">
                  <p className="mt-2 mb-1 font-mono text-[11px] tracking-wider text-dim uppercase">{g.group ? groupLabel(g.group) : "No group"}</p>
                  {g.members.map((m) => {
                    const rowIndex = rows.indexOf(m);
                    return (
                      <div
                        key={m.id}
                        role="row"
                        className="grid items-center gap-0.5 py-px"
                        style={{ gridTemplateColumns: `minmax(9rem, 1.4fr) repeat(${cols}, minmax(2.75rem, 1fr))` }}
                      >
                        <span role="rowheader" className={`truncate pr-2 text-sm ${m.openedHub ? "" : "text-dim"}`}>
                          {m.name}
                        </span>
                        {m.quizzes.map((q, col) => {
                          const focused = cursor.row === rowIndex && cursor.col === col;
                          return (
                            <div
                              key={q.slug}
                              role="gridcell"
                              data-cell={`${rowIndex}-${col}`}
                              tabIndex={focused ? 0 : -1}
                              aria-label={`${m.name}, ${quizLabel(q.slug)}: ${q.best === null ? "not attempted" : `${q.best} of ${q.outOf}`}`}
                              onClick={() => setCursor({ row: rowIndex, col })}
                              className={`h-7 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-text)] hover:brightness-125 ${q.best === null ? "pd-hatch" : ""}`}
                              style={q.best === null ? undefined : { background: shade(q.best, q.outOf) }}
                              {...tip(cellTip(m, q.slug))}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {tipLayer}
        </div>
      )}
    </Card>
  );
}
