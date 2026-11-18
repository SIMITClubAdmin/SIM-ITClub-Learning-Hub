"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Card, DataTable, useWidth } from "./parts";

type Day = { day: string; challenges: number; steps: number };

const SERIES = [
  { key: "challenges", label: "Challenges finished", colour: "var(--pd-series-1)" },
  { key: "steps", label: "Activity steps done", colour: "var(--pd-series-2)" },
] as const;

const HEIGHT = 220;
const M = { top: 14, right: 116, bottom: 26, left: 34 };

const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-SG", { day: "numeric", month: "short", timeZone: "UTC" });

/** Clean axis maximum: 4, 5, 10, 15, 20, 30, 40, 50, 100... */
function niceMax(n: number) {
  if (n <= 4) return 4;
  const steps = [5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300, 500, 1000];
  return steps.find((s) => s >= n) ?? Math.ceil(n / 1000) * 1000;
}

/** Daily challenges finished and activity steps done: two lines, a crosshair and a tooltip listing both. */
export function TimeChart({ days }: { days: Day[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const width = useWidth(wrap);
  const [active, setActive] = useState<number | null>(null);
  const plotW = Math.max(120, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const max = niceMax(Math.max(1, ...days.map((d) => Math.max(d.challenges, d.steps))));
  const x = (i: number) => M.left + (days.length <= 1 ? 0 : (i / (days.length - 1)) * plotW);
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const last = days.length - 1;
  const total = (key: "challenges" | "steps") => days.reduce((s, d) => s + d[key], 0);

  // Direct labels at the line ends, nudged apart when they would touch.
  const ends = SERIES.map((s) => ({ ...s, y: y(days[last]?.[s.key] ?? 0) }));
  if (Math.abs(ends[0].y - ends[1].y) < 16) {
    const mid = (ends[0].y + ends[1].y) / 2;
    const upper = ends[0].y <= ends[1].y ? 0 : 1;
    ends[upper].y = mid - 8;
    ends[1 - upper].y = mid + 8;
  }

  const pick = (clientX: number) => {
    const rect = wrap.current?.getBoundingClientRect();
    if (!rect || days.length === 0) return;
    const rel = clientX - rect.left - M.left;
    setActive(Math.max(0, Math.min(last, Math.round((rel / plotW) * last))));
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive((a) => Math.max(0, Math.min(last, (a ?? last) + (e.key === "ArrowLeft" ? -1 : 1))));
    }
  };
  const shown = active === null ? null : days[active];

  return (
    <Card
      title="Progress over time"
      description="What members finished each day, over the last 30 days (Singapore time)."
      table={
        <DataTable
          caption="Challenges finished and activity steps done per day"
          head={["Day", "Challenges finished", "Activity steps done"]}
          rows={[...days].reverse().map((d) => [dayLabel(d.day), d.challenges, d.steps])}
        />
      }
    >
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.colour }} />
            <span className="text-dim">{s.label}</span>
            <span className="font-mono text-ink">{total(s.key)}</span>
          </li>
        ))}
      </ul>
      <div
        ref={wrap}
        className="relative touch-pan-y outline-none focus-visible:ring-1 focus-visible:ring-accent"
        tabIndex={0}
        role="group"
        aria-label={`Line graph of the last 30 days: ${total("challenges")} challenges finished and ${total("steps")} activity steps done. Use the left and right arrow keys to read each day.`}
        onPointerMove={(e: PointerEvent) => pick(e.clientX)}
        onPointerDown={(e: PointerEvent) => pick(e.clientX)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(last)}
        onBlur={() => setActive(null)}
        onKeyDown={onKey}
      >
        <svg width={width} height={HEIGHT} aria-hidden="true" className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} stroke="var(--pd-grid)" strokeWidth={1} />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="fill-[var(--text-muted)] font-mono text-[11px]">
                {t}
              </text>
            </g>
          ))}
          {[0, Math.floor(last / 2), last].map((i) =>
            days[i] ? (
              <text key={i} x={x(i)} y={HEIGHT - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="fill-[var(--text-muted)] text-[11px]">
                {dayLabel(days[i].day)}
              </text>
            ) : null,
          )}
          {/* A soft wash under the challenges line only: two filled areas would hide each other. */}
          <path
            d={`M ${x(0)} ${y(0)} ${days.map((d, i) => `L ${x(i)} ${y(d.challenges)}`).join(" ")} L ${x(last)} ${y(0)} Z`}
            fill="var(--pd-series-1)"
            opacity={0.1}
          />
          {SERIES.map((s) => (
            <path
              key={s.key}
              d={days.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d[s.key])}`).join(" ")}
              fill="none"
              stroke={s.colour}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {ends.map((s) => (
            <g key={s.key}>
              <circle cx={x(last)} cy={y(days[last]?.[s.key] ?? 0)} r={4} fill={s.colour} stroke="var(--pd-surface)" strokeWidth={2} />
              <text x={x(last) + 10} y={s.y + 4} className="fill-[var(--text-main)] text-[11px]">
                <tspan className="font-mono">{days[last]?.[s.key] ?? 0}</tspan>
                <tspan className="fill-[var(--text-muted)]"> {s.key === "challenges" ? "challenges" : "steps"} today</tspan>
              </text>
            </g>
          ))}
          {shown && active !== null && (
            <g>
              <line x1={x(active)} x2={x(active)} y1={M.top} y2={M.top + plotH} stroke="var(--text-muted)" strokeWidth={1} />
              {SERIES.map((s) => (
                <circle key={s.key} cx={x(active)} cy={y(shown[s.key])} r={4} fill={s.colour} stroke="var(--pd-surface)" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
        {shown && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-20 border border-violet bg-bg px-3 py-2 text-sm shadow-lg"
            style={{
              left: x(active),
              transform: x(active) > width - 210 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <p className="mb-1 text-xs text-dim">{dayLabel(shown.day)}</p>
            {SERIES.map((s) => (
              <p key={s.key} className="flex items-center gap-2">
                <span aria-hidden="true" className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.colour }} />
                <strong className="font-mono text-ink">{shown[s.key]}</strong>
                <span className="text-dim">{s.label.toLowerCase()}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
