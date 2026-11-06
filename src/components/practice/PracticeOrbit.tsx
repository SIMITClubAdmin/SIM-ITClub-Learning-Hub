"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { Topic } from "@/lib/topics";

// Scene coordinates, in the SVG viewBox.
const W = 800;
const H = 520;
const PLANET = { x: 400, y: 255, r: 240 };
const ORBIT = { x: 400, y: 270, rx: 385, ry: 62, tilt: (-15 * Math.PI) / 180 };
// Angle along the orbit and diameter for each topic, left to right.
const STOPS = [
  { angle: 121, size: 84 },
  { angle: 90, size: 98 },
  { angle: 35, size: 104 },
];
const ROCKET_ANGLE = 150;
const NODE_COLORS = ["#be3caa", "#4f6cf0", "#1ea3c0"];
const CALLOUT_WIDTH = 280;

function orbitPoint(degrees: number) {
  const t = (degrees * Math.PI) / 180;
  const ex = ORBIT.rx * Math.cos(t);
  const ey = ORBIT.ry * Math.sin(t);
  const c = Math.cos(ORBIT.tilt);
  const s = Math.sin(ORBIT.tilt);
  return { x: ORBIT.x + ex * c - ey * s, y: ORBIT.y + ex * s + ey * c };
}

function arc(from: number, to: number) {
  const parts: string[] = [];
  for (let d = from; d <= to; d += 3) {
    const p = orbitPoint(d);
    parts.push(`${parts.length ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return parts.join(" ");
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
    </svg>
  );
}

function Rocket() {
  const p = orbitPoint(ROCKET_ANGLE);
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(-112)`}>
      <g className="orbit-rocket">
        <path d="M0 -22 C9 -12 9 6 6 14 H-6 C-9 6 -9 -12 0 -22Z" fill="#e6f1ff" />
        <circle cy="-6" r="4" fill="#070b1f" />
        <path d="M-6 6 L-13 16 L-6 14Z M6 6 L13 16 L6 14Z" fill="#6d4aff" />
        <path className="orbit-flame" d="M-4 15 L0 26 L4 15Z" fill="#4fd8eb" />
      </g>
    </g>
  );
}

/** Planet with an orbit; each moon on the front of the orbit is a practice topic. */
export function PracticeOrbit({ topics }: { topics: Topic[] }) {
  const calloutId = useId();
  const firstOpen = Math.max(0, topics.findIndex((t) => !t.lockedReason));
  const [selected, setSelected] = useState(firstOpen);
  const topic = topics[selected];
  const node = orbitPoint(STOPS[selected].angle);
  const nodeTop = node.y - STOPS[selected].size / 2;

  // Keep the callout inside the scene while its pointer stays above the moon.
  const calloutLeft = `clamp(0px, calc(${pct(node.x, W)} - ${CALLOUT_WIDTH / 2}px), calc(100% - ${CALLOUT_WIDTH}px))`;

  return (
    <div className="relative mx-auto w-full max-w-3xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="planet-fill" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#3b2f8f" />
            <stop offset="55%" stopColor="#1f1e5c" />
            <stop offset="100%" stopColor="#0d1233" />
          </radialGradient>
        </defs>
        <path d={arc(180, 360)} fill="none" stroke="#94aaff" strokeOpacity="0.55" strokeWidth="2" />
        <circle cx={PLANET.x} cy={PLANET.y} r={PLANET.r} fill="url(#planet-fill)" />
        <circle
          cx={PLANET.x}
          cy={PLANET.y}
          r={PLANET.r}
          fill="none"
          stroke="#6d4aff"
          strokeOpacity="0.5"
          strokeWidth="2"
        />
        <path d={arc(0, 180)} fill="none" stroke="#94aaff" strokeOpacity="0.9" strokeWidth="2" />
        <Rocket />
      </svg>

      {topics.map((t, i) => {
        const stop = STOPS[i];
        const p = orbitPoint(stop.angle);
        const locked = !!t.lockedReason;
        const style = {
          left: pct(p.x, W),
          top: pct(p.y, H),
          width: pct(stop.size, W),
          background: locked ? "#232a52" : NODE_COLORS[i],
        };
        const className = `orbit-node absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full font-mono text-sm font-medium ${
          locked ? "text-dim" : "text-ink"
        } ${selected === i ? "is-selected" : ""}`;
        const content = (
          <>
            {t.short}
            {locked && <LockIcon className="mt-0.5 size-3.5" />}
          </>
        );
        const handlers = {
          onPointerEnter: () => setSelected(i),
          onFocus: () => setSelected(i),
        };
        return locked ? (
          <span
            key={t.slug}
            tabIndex={0}
            role="link"
            aria-disabled="true"
            aria-label={`${t.name}, locked`}
            aria-describedby={selected === i ? calloutId : undefined}
            className={className}
            style={style}
            {...handlers}
          >
            {content}
          </span>
        ) : (
          <Link
            key={t.slug}
            href={`/practice/${t.slug}`}
            aria-label={`Practice ${t.name}`}
            aria-describedby={selected === i ? calloutId : undefined}
            className={className}
            style={style}
            {...handlers}
          >
            {content}
          </Link>
        );
      })}

      <div
        id={calloutId}
        role="status"
        className="pointer-events-none absolute border border-violet bg-bg/95 p-5 text-left"
        style={{
          width: CALLOUT_WIDTH,
          left: calloutLeft,
          bottom: `calc(${pct(H - nodeTop, H)} + 18px)`,
        }}
      >
        <h2 className="flex items-center gap-2 text-3xl font-semibold">
          {topic.name}
          {topic.lockedReason && <LockIcon className="size-5 text-dim" />}
        </h2>
        <p className="mt-2 text-sm text-dim">{topic.summary}</p>
        <p className="mt-3 font-mono text-xs tracking-wider text-accent uppercase">
          {topic.lockedReason ?? "Open: click the moon to start"}
        </p>
        <span
          className="absolute top-full size-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-violet"
          style={{ left: `calc(${pct(node.x, W)} - ${calloutLeft})` }}
        />
      </div>
    </div>
  );
}
