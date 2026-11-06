"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Topic } from "@/lib/topics";

// Scene coordinates, in the SVG viewBox.
const W = 800;
const H = 520;
const PLANET = { x: 400, y: 255, r: 220 };
const TILT_DEG = -15;
const TILT = (TILT_DEG * Math.PI) / 180;
const ORBIT = { x: 400, y: 270, rx: 385, ry: 62 };
// The planet's own rings, as fractions of the moon orbit.
const RINGS = [
  { scale: 0.66, width: 10, opacity: 0.35 },
  { scale: 0.73, width: 16, opacity: 0.55 },
  { scale: 0.81, width: 7, opacity: 0.3 },
];
// Angle along the orbit and diameter for each topic, left to right.
const STOPS = [
  { angle: 121, size: 84 },
  // 81° puts CSS the same on-screen distance from HTML and JS (about 257 units each).
  { angle: 81, size: 98 },
  { angle: 35, size: 104 },
];
// How far behind a moon the rocket waits, in degrees along the orbit.
const ROCKET_TRAIL = 24;
const ROCKET_TRAVEL_MS = 1400;
const NODE_COLORS = ["#be3caa", "#4f6cf0", "#1ea3c0"];
const CALLOUT_WIDTH = 280;

function orbitPoint(degrees: number, scale = 1) {
  const t = (degrees * Math.PI) / 180;
  const ex = ORBIT.rx * scale * Math.cos(t);
  const ey = ORBIT.ry * scale * Math.sin(t);
  return {
    x: ORBIT.x + ex * Math.cos(TILT) - ey * Math.sin(TILT),
    y: ORBIT.y + ex * Math.sin(TILT) + ey * Math.cos(TILT),
  };
}

/** Rotation that points the rocket's nose along the orbit, towards the next moon. */
function headingAt(degrees: number) {
  const a = orbitPoint(degrees);
  const b = orbitPoint(degrees - 1);
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
}

function arc(from: number, to: number, scale = 1) {
  const parts: string[] = [];
  for (let d = from; d <= to; d += 3) {
    const p = orbitPoint(d, scale);
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

/** Rocket parked just behind the latest open moon; it flies along the orbit when that changes. */
function Rocket({ checkpoint }: { checkpoint: number }) {
  const target = STOPS[checkpoint].angle + ROCKET_TRAIL;
  const [angle, setAngle] = useState(target);
  const angleRef = useRef(target);

  useEffect(() => {
    const from = angleRef.current;
    if (from === target) return;
    // With reduced motion the rocket jumps straight to the new checkpoint.
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ROCKET_TRAVEL_MS;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      angleRef.current = from + (target - from) * eased;
      setAngle(angleRef.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const p = orbitPoint(angle);
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${headingAt(angle)})`}>
      <g className="orbit-rocket">
        <path d="M0 -22 C9 -12 9 6 6 14 H-6 C-9 6 -9 -12 0 -22Z" fill="#e6f1ff" />
        <circle cy="-6" r="4" fill="#070b1f" />
        <path d="M-6 6 L-13 16 L-6 14Z M6 6 L13 16 L6 14Z" fill="#6d4aff" />
        <path className="orbit-flame" d="M-4 15 L0 26 L4 15Z" fill="#4fd8eb" />
      </g>
    </g>
  );
}

function Planet() {
  const { x, y, r } = PLANET;
  // Bands and storms are drawn twice side by side so the slow drift can loop without a seam.
  const bands = [
    { dy: -150, h: 34, color: "#6a58d6" },
    { dy: -95, h: 22, color: "#a493f5" },
    { dy: -45, h: 40, color: "#5646c2" },
    { dy: 18, h: 26, color: "#b8a9ff" },
    { dy: 70, h: 44, color: "#6150cc" },
    { dy: 135, h: 24, color: "#9584ec" },
  ];
  const storms = [
    { dx: -90, dy: 30, rx: 34, ry: 12 },
    { dx: 120, dy: -70, rx: 22, ry: 8 },
    { dx: 20, dy: 110, rx: 18, ry: 6 },
  ];
  const span = r * 2;
  return (
    <g>
      <circle cx={x} cy={y} r={r + 26} fill="url(#planet-glow)" />
      <g clipPath="url(#planet-clip)">
        <circle cx={x} cy={y} r={r} fill="#4a3db0" />
        <g transform={`rotate(${TILT_DEG} ${x} ${y})`}>
          <g className="planet-spin">
            {[0, span].map((offset) => (
              <g key={offset} transform={`translate(${offset - r} 0)`}>
                {bands.map((b) => (
                  <rect
                    key={b.dy}
                    x={x - r}
                    y={y + b.dy}
                    width={span + 2}
                    height={b.h}
                    fill={b.color}
                    opacity="0.85"
                  />
                ))}
                {storms.map((s) => (
                  <ellipse
                    key={s.dx}
                    cx={x + s.dx}
                    cy={y + s.dy}
                    rx={s.rx}
                    ry={s.ry}
                    fill="#be3caa"
                    opacity="0.45"
                  />
                ))}
              </g>
            ))}
          </g>
        </g>
        <circle cx={x} cy={y} r={r} fill="url(#planet-shade)" />
      </g>
      {/* A thin cyan rim keeps the outline sharp over any nebula cloud. */}
      <circle cx={x} cy={y} r={r} fill="none" stroke="#4fd8eb" strokeOpacity="0.7" strokeWidth="2.5" />
    </g>
  );
}

function Rings({ half }: { half: "back" | "front" }) {
  const [from, to] = half === "back" ? [180, 360] : [0, 180];
  return (
    <g className="planet-rings">
      {RINGS.map((ring) => (
        <path
          key={ring.scale}
          d={arc(from, to, ring.scale)}
          fill="none"
          stroke="#d4caff"
          strokeOpacity={half === "back" ? ring.opacity * 0.6 : Math.min(1, ring.opacity * 1.5)}
          strokeWidth={ring.width}
        />
      ))}
    </g>
  );
}

/** Ringed planet with a moon orbit; each moon is a practice topic. */
export function PracticeOrbit({ topics }: { topics: Topic[] }) {
  const calloutId = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const openCount = topics.filter((t) => !t.lockedReason).length;
  const checkpoint = Math.max(0, openCount - 1);

  const topic = selected === null ? null : topics[selected];
  const node = selected === null ? null : orbitPoint(STOPS[selected].angle);
  const nodeTop = node && selected !== null ? node.y - STOPS[selected].size / 2 : 0;
  // Keep the callout inside the scene while its pointer stays above the moon.
  const calloutLeft = node
    ? `clamp(0px, calc(${pct(node.x, W)} - ${CALLOUT_WIDTH / 2}px), calc(100% - ${CALLOUT_WIDTH}px))`
    : "0px";

  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <defs>
          <clipPath id="planet-clip">
            <circle cx={PLANET.x} cy={PLANET.y} r={PLANET.r} />
          </clipPath>
          <radialGradient id="planet-shade" cx="32%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="80%" stopColor="#070b1f" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#070b1f" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id="planet-glow">
            <stop offset="80%" stopColor="#6d4aff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6d4aff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="planet-halo">
            <stop offset="45%" stopColor="#070b1f" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#070b1f" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Dark halo fades the background clouds near the planet, like a spotlight. */}
        <ellipse cx={PLANET.x} cy={PLANET.y + 10} rx={PLANET.r + 200} ry={PLANET.r + 60} fill="url(#planet-halo)" />
        <Rings half="back" />
        <path d={arc(180, 360)} fill="none" stroke="#94aaff" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 6" />
        <Planet />
        <Rings half="front" />
        <path d={arc(0, 180)} fill="none" stroke="#94aaff" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="4 6" />
        <Rocket checkpoint={checkpoint} />
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
        const className = `orbit-node absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full font-mono text-sm font-medium text-ink ${
          locked ? "is-locked" : ""
        } ${selected === i ? "is-selected" : ""}`;
        const content = (
          <>
            {t.short}
            {locked && <LockIcon className="mt-0.5 size-3.5" />}
          </>
        );
        const handlers = {
          onPointerEnter: () => setSelected(i),
          onPointerLeave: () => setSelected((s) => (s === i ? null : s)),
          onFocus: () => setSelected(i),
          onBlur: () => setSelected((s) => (s === i ? null : s)),
          "aria-describedby": selected === i ? calloutId : undefined,
          className,
          style,
        };
        return locked ? (
          <span key={t.slug} tabIndex={0} role="link" aria-disabled="true" aria-label={`${t.name}, locked`} {...handlers}>
            {content}
          </span>
        ) : (
          <Link key={t.slug} href={`/practice/${t.slug}`} aria-label={`Practice ${t.name}`} {...handlers}>
            {content}
          </Link>
        );
      })}

      {topic && node && (
        <div
          id={calloutId}
          role="tooltip"
          className="orbit-callout pointer-events-none absolute border border-violet bg-bg/95 p-5 text-left"
          style={{
            width: CALLOUT_WIDTH,
            left: calloutLeft,
            bottom: `calc(${pct(H - nodeTop, H)} + 18px)`,
          }}
        >
          <p className="flex items-center gap-2 font-display text-3xl font-semibold">
            {topic.name}
            {topic.lockedReason && <LockIcon className="size-5 text-dim" />}
          </p>
          <p className="mt-2 text-sm text-dim">{topic.summary}</p>
          <p className="mt-3 font-mono text-xs tracking-wider text-accent uppercase">
            {topic.lockedReason ?? "Open: click to start"}
          </p>
          <span
            className="absolute top-full size-0 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-violet"
            style={{ left: `calc(${pct(node.x, W)} - ${calloutLeft})` }}
          />
        </div>
      )}
    </div>
  );
}
