"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { needsFullPageLoad } from "@/components/git-studio/isolation";
import { nextRocketStop } from "@/lib/learn-trail";
import type { PlanetPalette, Topic } from "@/lib/topics";

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

/**
 * Rocket parked just behind a moon; it flies along the orbit when that changes.
 * from is the moon it starts behind, so it can fly from there to checkpoint on arrival.
 */
function Rocket({ checkpoint, from = checkpoint }: { checkpoint: number; from?: number }) {
  const target = STOPS[checkpoint].angle + ROCKET_TRAIL;
  const start = STOPS[from].angle + ROCKET_TRAIL;
  const [angle, setAngle] = useState(start);
  const angleRef = useRef(start);

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

function Planet({ palette, ids }: { palette: PlanetPalette; ids: Ids }) {
  const { x, y, r } = PLANET;
  // Bands and storms are drawn twice side by side so the slow drift can loop without a seam.
  const bands = [
    { dy: -150, h: 34, color: palette.bands[0] },
    { dy: -95, h: 22, color: palette.bands[1] },
    { dy: -45, h: 40, color: palette.bands[2] },
    { dy: 18, h: 26, color: palette.bands[3] },
    { dy: 70, h: 44, color: palette.bands[4] },
    { dy: 135, h: 24, color: palette.bands[5] },
  ];
  const storms = [
    { dx: -90, dy: 30, rx: 34, ry: 12 },
    { dx: 120, dy: -70, rx: 22, ry: 8 },
    { dx: 20, dy: 110, rx: 18, ry: 6 },
  ];
  const span = r * 2;
  return (
    <g>
      <circle cx={x} cy={y} r={r + 26} fill={`url(#${ids.glow})`} />
      <g clipPath={`url(#${ids.clip})`}>
        <circle cx={x} cy={y} r={r} fill={palette.base} />
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
                    fill={palette.storm}
                    opacity="0.45"
                  />
                ))}
              </g>
            ))}
          </g>
        </g>
        <circle cx={x} cy={y} r={r} fill={`url(#${ids.shade})`} />
      </g>
      {/* A thin cyan rim keeps the outline sharp over any nebula cloud. */}
      <circle cx={x} cy={y} r={r} fill="none" stroke={palette.rim} strokeOpacity="0.7" strokeWidth="2.5" />
    </g>
  );
}

function Rings({ half, color }: { half: "back" | "front"; color: string }) {
  const [from, to] = half === "back" ? [180, 360] : [0, 180];
  return (
    <g className="planet-rings">
      {RINGS.map((ring) => (
        <path
          key={ring.scale}
          d={arc(from, to, ring.scale)}
          fill="none"
          stroke={color}
          strokeOpacity={half === "back" ? ring.opacity * 0.6 : Math.min(1, ring.opacity * 1.5)}
          strokeWidth={ring.width}
        />
      ))}
    </g>
  );
}

type Ids = { clip: string; shade: string; glow: string; halo: string };

type Props = {
  topics: Topic[];
  palette: PlanetPalette;
  /** Only the planet holding the student's checkpoint shows the rocket. */
  showRocket?: boolean;
  /** "learn" moons open the topic's first lesson; "practice" moons open its practice set. */
  mode?: "learn" | "practice";
};

/** Ringed planet with a moon orbit; each moon is a practice topic. */
export function PracticeOrbit({ topics, palette, showRocket = true, mode = "practice" }: Props) {
  const calloutId = useId();
  const uid = useId();
  const ids: Ids = { clip: `${uid}clip`, shade: `${uid}shade`, glow: `${uid}glow`, halo: `${uid}halo` };
  const [selected, setSelected] = useState<number | null>(null);
  const openCount = topics.filter((t) => !t.lockedReason).length;
  const checkpoint = Math.max(0, openCount - 1);
  // On Learn, the rocket heads for the topic after the one last studied (HTML to start).
  // It reads this tab's history after mounting, so the server never guesses it.
  const slugs = topics.map((t) => t.slug).join(",");
  const [learnStop, setLearnStop] = useState<{ from: number; to: number } | null>(null);
  useEffect(() => {
    // Only the planet carrying the rocket tracks it, so other planets can't overwrite its stop.
    if (mode !== "learn" || !showRocket) return;
    // Browser-only history; reading it after mount keeps server and client markup the same.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLearnStop(nextRocketStop(slugs.split(",")));
  }, [mode, showRocket, slugs]);

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
          <clipPath id={ids.clip}>
            <circle cx={PLANET.x} cy={PLANET.y} r={PLANET.r} />
          </clipPath>
          <radialGradient id={ids.shade} cx="32%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="80%" stopColor="#070b1f" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#070b1f" stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id={ids.glow}>
            <stop offset="80%" stopColor={palette.glow} stopOpacity="0.35" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={ids.halo}>
            <stop offset="45%" stopColor="#070b1f" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#070b1f" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Dark halo fades the background clouds near the planet, like a spotlight. */}
        <ellipse cx={PLANET.x} cy={PLANET.y + 10} rx={PLANET.r + 200} ry={PLANET.r + 60} fill={`url(#${ids.halo})`} />
        <Rings half="back" color={palette.ring} />
        <path d={arc(180, 360)} fill="none" stroke="#94aaff" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 6" />
        <Planet palette={palette} ids={ids} />
        <Rings half="front" color={palette.ring} />
        <path d={arc(0, 180)} fill="none" stroke="#94aaff" strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="4 6" />
        {showRocket &&
          (mode === "learn" ? (
            learnStop && <Rocket checkpoint={learnStop.to} from={learnStop.from} />
          ) : (
            <Rocket checkpoint={checkpoint} />
          ))}
      </svg>

      {topics.map((t, i) => {
        const stop = STOPS[i];
        const p = orbitPoint(stop.angle);
        const href = mode === "learn" ? t.lessons.find((l) => l.href)?.href : `/practice/${t.slug}`;
        const locked = !!t.lockedReason || !href;
        const style = {
          left: pct(p.x, W),
          top: pct(p.y, H),
          width: pct(stop.size, W),
          background: locked ? "#232a52" : palette.moons[i],
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
        ) : needsFullPageLoad(href) ? (
          // The Git studio needs a full page load to get its isolation headers.
          <a key={t.slug} href={href} aria-label={`${mode === "learn" ? "Learn" : "Challenge"} ${t.name}`} {...handlers}>
            {content}
          </a>
        ) : (
          <Link key={t.slug} href={href} aria-label={`${mode === "learn" ? "Learn" : "Challenge"} ${t.name}`} {...handlers}>
            {content}
          </Link>
        );
      })}

      {/* On Learn, a small planet beside the CSS moon opens the CSS Playground. */}
      {mode === "learn" &&
        (() => {
          const css = topics.findIndex((t) => t.slug === "css");
          if (css === -1) return null;
          const p = orbitPoint(STOPS[css].angle);
          return (
            <Link
              href="/learn/playground"
              aria-label="Open the CSS Playground"
              className="playground-planet group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: pct(p.x + 84, W), top: pct(p.y + 56, H), width: pct(44, W) }}
            >
              {/* A plain round moon, like the topic moons, just smaller. */}
              <span className="block aspect-square w-full rounded-full bg-[#e8835f]" />
              <span className="mt-1 font-mono text-xs whitespace-nowrap text-ink group-hover:text-accent">CSS Playground</span>
            </Link>
          );
        })()}

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
            {(topic.lockedReason || (mode === "learn" && !topic.lessons.some((l) => l.href))) && (
              <LockIcon className="size-5 text-dim" />
            )}
          </p>
          <p className="mt-2 text-sm text-dim">{topic.summary}</p>
          <p className="mt-3 font-mono text-xs tracking-wider text-accent uppercase">
            {topic.lockedReason ??
              (mode === "learn"
                ? topic.lessons.some((l) => l.href)
                  ? `${topic.lessons.length} lesson${topic.lessons.length === 1 ? "" : "s"}: click to start`
                  : "Lessons coming soon"
                : "Open: click to start")}
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
