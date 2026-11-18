"use client";

import { useState } from "react";
import { ACTIVITIES, stepWord, type ActivityId } from "@/lib/activities";
import { biggestDrop, stepFunnel, type DashboardMember } from "@/lib/progress-dashboard";
import { Card, DataTable, TipLines, useTip, useWidth } from "./parts";

const HEIGHT = 230;
const M = { top: 34, right: 8, bottom: 30, left: 34 };

/** For one activity at a time: how many members have finished each step, and where most stop. */
export function StepChart({ members }: { members: DashboardMember[] }) {
  const [activityId, setActivityId] = useState<ActivityId>(ACTIVITIES[0].id);
  const activity = ACTIVITIES.find((a) => a.id === activityId)!;
  const { box: tipBox, tip, layer: tipLayer } = useTip();
  const width = useWidth(tipBox);
  const funnel = stepFunnel(members, activityId);
  const drop = biggestDrop(funnel);
  const total = members.length;
  const max = Math.max(1, total);
  const plotW = Math.max(120, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const band = plotW / funnel.length;
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const word = stepWord(activity);
  // The top line is "everyone in the filter", so its tick is that count rather than a rounded one.
  const ticks = [0, max];

  return (
    <Card
      title="Where members get stuck"
      description={`Members who have finished each ${word.toLowerCase()} of ${activity.title}, out of ${total}.`}
      actions={
        <div role="tablist" aria-label="Activity" className="flex gap-1">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={a.id === activityId}
              onClick={() => setActivityId(a.id)}
              className={`border px-2.5 py-1 text-sm ${a.id === activityId ? "border-accent text-ink" : "border-violet/60 text-dim hover:border-accent"}`}
            >
              {a.title}
            </button>
          ))}
        </div>
      }
      table={
        <DataTable
          caption={`Members who finished each ${word.toLowerCase()} of ${activity.title}`}
          head={[word, "Members", "Share"]}
          rows={funnel.map((f) => [`${f.step}. ${activity.stepNames[f.step - 1]}`, f.count, total ? `${Math.round((f.count / total) * 100)}%` : "-"])}
        />
      }
    >
      <div ref={tipBox} className="relative">
        <svg width={width} height={HEIGHT} role="group" aria-label={`${activity.title}: members per ${word.toLowerCase()}`} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t} aria-hidden="true">
              <line x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} stroke="var(--pd-grid)" strokeWidth={1} />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="fill-[var(--text-muted)] font-mono text-[11px]">
                {t}
              </text>
            </g>
          ))}
          {funnel.map((f, i) => {
            const cx = M.left + band * i + band / 2;
            const h = Math.max(0, M.top + plotH - y(f.count));
            const isDrop = drop?.step === f.step;
            const name = activity.stepNames[f.step - 1];
            const label = `${word} ${f.step}, ${name}: ${f.count} of ${total} members`;
            return (
              <g key={f.step} tabIndex={0} aria-label={label} className="group outline-none" {...tip(<TipLines value={`${f.count} of ${total} members`} label={`${word} ${f.step} · ${name}`} />)}>
                {/* The hit target is the whole column, not just the bar. */}
                <rect x={cx - band / 2} y={M.top} width={band} height={plotH} fill="transparent" />
                {h > 0 && (
                  <path
                    className="pd-anim"
                    d={`M ${cx - barW / 2} ${M.top + plotH} V ${M.top + plotH - h + Math.min(4, h)} Q ${cx - barW / 2} ${M.top + plotH - h} ${cx - barW / 2 + Math.min(4, h)} ${M.top + plotH - h} H ${cx + barW / 2 - Math.min(4, h)} Q ${cx + barW / 2} ${M.top + plotH - h} ${cx + barW / 2} ${M.top + plotH - h + Math.min(4, h)} V ${M.top + plotH} Z`}
                    fill={isDrop ? "var(--pd-seq-5)" : "var(--pd-seq-3)"}
                  />
                )}
                <rect x={cx - band / 2 + 2} y={M.top} width={band - 4} height={plotH} fill="none" className="stroke-transparent group-focus-visible:stroke-[var(--accent-text)]" strokeWidth={1} />
                <text x={cx} y={HEIGHT - 10} textAnchor="middle" className="fill-[var(--text-muted)] font-mono text-[11px]" aria-hidden="true">
                  {f.step}
                </text>
                {isDrop && (
                  // Above the plot, with a hairline down to the bar, so it never sits on a neighbour.
                  <g aria-hidden="true">
                    <line x1={cx} x2={cx} y1={M.top - 12} y2={y(f.count) - 4} stroke="var(--text-muted)" strokeWidth={1} />
                    <text
                      x={Math.min(Math.max(cx, M.left + 60), M.left + plotW - 60)}
                      y={M.top - 18}
                      textAnchor="middle"
                      className="fill-[var(--text-main)] text-[11px] font-semibold"
                    >
                      Most stop before {word.toLowerCase()} {f.step}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
        {tipLayer}
      </div>
      <p className="text-xs text-dim">
        {word}s: {activity.stepNames.map((n, i) => `${i + 1} ${n}`).join(" · ")}
      </p>
    </Card>
  );
}
