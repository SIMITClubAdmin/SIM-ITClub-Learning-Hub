"use client";

import { useCallback, useEffect, useId, useRef, useState, type FocusEvent, type PointerEvent, type ReactNode, type RefObject } from "react";

/* ---------- Card: a chart's frame, with its title and the "Show as table" twin ---------- */

export function Card({
  title,
  description,
  actions,
  table,
  children,
  className = "",
}: {
  title: string;
  description?: ReactNode;
  /** Controls in the card's header (tabs and the like). */
  actions?: ReactNode;
  /** The chart's numbers as a table: every chart has one, for screen readers and exact values. */
  table?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={`flex min-w-0 flex-col gap-4 border border-violet bg-bg/85 p-4 sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          {description && <p className="text-sm text-dim">{description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {table && (
            <button
              type="button"
              aria-pressed={asTable}
              onClick={() => setAsTable((v) => !v)}
              className="border border-violet/60 px-2.5 py-1 font-mono text-xs tracking-wider text-dim uppercase hover:border-accent hover:text-ink"
            >
              {asTable ? "Show chart" : "Show as table"}
            </button>
          )}
        </div>
      </div>
      {asTable && table ? <div className="max-h-96 overflow-auto">{table}</div> : children}
    </section>
  );
}

/** A plain data table in the dashboard's style. */
export function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="sticky top-0 bg-bg font-mono text-xs tracking-wider text-dim uppercase">
        <tr className="border-b border-violet/60">
          {head.map((h) => (
            <th key={h} scope="col" className="px-2 py-2 font-normal">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-grid">
            {row.map((cell, j) => (
              <td key={j} className={`px-2 py-1.5 ${j > 0 ? "font-mono" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ---------- Size: charts draw at their container's real width, so lines stay 2px ---------- */

export function useWidth(ref: RefObject<HTMLElement | null>, fallback = 640) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/* ---------- Tooltips: the same details on hover and on keyboard focus ---------- */

type Tip = { x: number; y: number; width: number; content: ReactNode };

/**
 * One tooltip per chart. tip(content) gives a mark the handlers that show it next to the
 * pointer, or above the mark when it has keyboard focus. The tooltip never takes the pointer.
 * Put `box` on the chart's positioned wrapper and render `layer` inside it.
 */
export function useTip() {
  const box = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<Tip | null>(null);

  const show = useCallback((clientX: number, clientY: number, content: ReactNode) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setCurrent({ x: clientX - rect.left, y: clientY - rect.top, width: rect.width, content });
  }, []);
  const hide = useCallback(() => setCurrent(null), []);

  const tip = useCallback(
    (content: ReactNode) => ({
      onPointerEnter: (e: PointerEvent) => show(e.clientX, e.clientY, content),
      onPointerMove: (e: PointerEvent) => show(e.clientX, e.clientY, content),
      onPointerLeave: hide,
      onFocus: (e: FocusEvent<Element>) => {
        const r = e.currentTarget.getBoundingClientRect();
        show(r.left + r.width / 2, r.top, content);
      },
      onBlur: hide,
    }),
    [show, hide],
  );

  const layer = current ? <TipBubble tip={current} /> : null;
  return { box, tip, layer, show, hide };
}

function TipBubble({ tip }: { tip: Tip }) {
  // Keep it inside the chart: flip to the left of the pointer near the right edge.
  const flip = tip.x > tip.width - 200;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 max-w-60 border border-violet bg-bg px-3 py-2 text-sm shadow-lg"
      style={{
        left: tip.x,
        top: tip.y,
        transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, calc(-100% - 8px))`,
      }}
    >
      {tip.content}
    </div>
  );
}

/** Tooltip body: the value leads, the label follows. */
export function TipLines({ value, label, extra }: { value: ReactNode; label: ReactNode; extra?: ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <strong className="font-mono text-base text-ink">{value}</strong>
      <span className="text-dim">{label}</span>
      {extra && <span className="text-xs text-dim">{extra}</span>}
    </span>
  );
}

/* ---------- Hatch: the "not started" texture, so it never relies on colour ---------- */

export function HatchDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(135)">
        <rect width="5" height="5" fill="var(--pd-none)" />
        <rect width="1.5" height="5" fill="var(--pd-hatch)" />
      </pattern>
    </defs>
  );
}

/* ---------- Donut ring: one ratio against its whole, with the figure in the middle ---------- */

export function DonutRing({
  value,
  figure,
  label,
  detail,
  size = 104,
  thickness = 10,
}: {
  /** 0 to 1. */
  value: number;
  figure: string;
  label: string;
  detail?: string;
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <figure className="flex flex-col items-center gap-2 text-center" role="img" aria-label={`${label}: ${figure}${detail ? `, ${detail}` : ""}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pd-track)" strokeWidth={thickness} />
          {v > 0 && (
            <circle
              className="pd-anim"
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--pd-seq-5)"
              strokeWidth={thickness}
              strokeLinecap={v < 1 ? "round" : "butt"}
              strokeDasharray={`${Math.max(0.001, v * c - (v < 1 ? thickness * 0.5 : 0))} ${c}`}
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-xl font-semibold text-ink">{figure}</span>
      </div>
      <figcaption className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        {detail && <span className="text-xs text-dim">{detail}</span>}
      </figcaption>
    </figure>
  );
}

/* ---------- Donut wheel: one whole split into a few parts, each hoverable ---------- */

export type WheelPart = {
  key: string;
  label: string;
  count: number;
  /** A CSS colour, or "hatch" for the not-started texture. */
  fill: string;
  /** Shown in the tooltip: who is in this part. */
  names: string[];
};

export function DonutWheel({
  parts,
  centre,
  centreLabel,
  size = 132,
  thickness = 18,
  tip,
}: {
  parts: WheelPart[];
  centre: string;
  centreLabel: string;
  size?: number;
  thickness?: number;
  tip: ReturnType<typeof useTip>["tip"];
}) {
  const hatchId = useId().replace(/:/g, "");
  const total = parts.reduce((s, p) => s + p.count, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  // A 2px surface gap between parts, measured along the ring.
  const gap = 2 / r;
  const shown = parts.filter((p) => p.count > 0);
  // Where each part starts, clockwise from the top.
  const starts = shown.map((_, i) => -Math.PI / 2 + (shown.slice(0, i).reduce((s, p) => s + p.count, 0) / (total || 1)) * Math.PI * 2);
  const point = (a: number) => `${cx + r * Math.cos(a)} ${cx + r * Math.sin(a)}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="group" aria-label={`${centreLabel}: ${centre}`} className="shrink-0 overflow-visible">
      <HatchDefs id={hatchId} />
      {total === 0 && <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--pd-track)" strokeWidth={thickness} />}
      {shown.map((p, i) => {
        const sweep = (p.count / total) * Math.PI * 2;
        const start = starts[i];
        const stroke = p.fill === "hatch" ? `url(#${hatchId})` : p.fill;
        const names = p.names.length > 8 ? `${p.names.slice(0, 8).join(", ")} and ${p.names.length - 8} more` : p.names.join(", ");
        const handlers = tip(<TipLines value={`${p.count} of ${total}`} label={p.label} extra={names} />);
        const label = `${p.label}: ${p.count} of ${total}`;
        if (shown.length === 1) {
          return (
            <circle key={p.key} cx={cx} cy={cx} r={r} fill="none" stroke={stroke} strokeWidth={thickness} tabIndex={0} aria-label={label} className="cursor-default outline-none focus-visible:stroke-[var(--accent-hover)]" {...handlers} />
          );
        }
        const a0 = start + gap / 2;
        const a1 = start + sweep - gap / 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        return (
          <g key={p.key} tabIndex={0} aria-label={label} className="group cursor-default outline-none" {...handlers}>
            {/* A wider invisible stroke: the hit target is bigger than the mark. */}
            <path d={`M ${point(a0)} A ${r} ${r} 0 ${large} 1 ${point(a1)}`} fill="none" stroke="transparent" strokeWidth={thickness + 12} />
            <path
              d={`M ${point(a0)} A ${r} ${r} 0 ${large} 1 ${point(a1)}`}
              fill="none"
              stroke={stroke}
              strokeWidth={thickness}
              className="transition-[stroke-width] group-hover:[stroke-width:22px] group-focus-visible:[stroke-width:22px]"
            />
          </g>
        );
      })}
      <text x={cx} y={cx - 2} textAnchor="middle" className="fill-[var(--text-main)] font-mono text-2xl font-semibold">
        {centre}
      </text>
      <text x={cx} y={cx + 16} textAnchor="middle" className="fill-[var(--text-muted)] text-[11px]">
        {centreLabel}
      </text>
    </svg>
  );
}

/** The swatch beside a legend entry: the part's colour, or the hatch. */
export function Swatch({ fill }: { fill: string }) {
  return fill === "hatch" ? (
    <span aria-hidden="true" className="pd-hatch inline-block size-3 shrink-0 rounded-sm" />
  ) : (
    <span aria-hidden="true" className="inline-block size-3 shrink-0 rounded-sm" style={{ background: fill }} />
  );
}

/* ---------- Meter: one ratio as a thin track ---------- */

export function Meter({ value, label, figure, compact = false }: { value: number; label: string; figure: string; compact?: boolean }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={`flex min-w-0 flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
      {!compact && (
        <div className="flex justify-between gap-2 text-sm">
          <span className="text-dim">{label}</span>
          <span className="font-mono text-ink">{figure}</span>
        </div>
      )}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v * 100)}
        aria-valuetext={figure}
        className={`${compact ? "h-1.5" : "h-2"} overflow-hidden rounded-full`}
        style={{ background: "var(--pd-track)" }}
      >
        <div className="pd-anim h-full rounded-full" style={{ width: `${v * 100}%`, background: "var(--pd-seq-5)" }} />
      </div>
    </div>
  );
}
