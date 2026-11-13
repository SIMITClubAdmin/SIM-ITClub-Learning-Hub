"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { needsFullPageLoad } from "@/components/git-studio/isolation";
import { nextRocketStop } from "@/lib/learn-trail";
import { useAppearance } from "@/lib/appearance";
import { planetLook, type PlanetLook } from "@/lib/planet-looks";
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

/** The dashed moon orbit: telemetry for Code, soft dashes for Sakura, a frosted trail for Winter. */
const ORBIT_DASH: Record<PlanetLook["kind"], string> = { gas: "4 6", cyber: "6 4 1 4", sakura: "4 6", ice: "2 6" };

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

/** Gradient stops for a list of colours, the first band kept narrow so the highlight stays small. */
function bodyStops(colors: string[], kind: PlanetLook["kind"]) {
  const n = colors.length - 1;
  return colors.map((color, i) => {
    const offset = kind === "cyber" ? [0, 55, 100][i] ?? 100 : i === 0 ? 0 : Math.round(Math.pow(i / n, 0.85) * 100);
    return <stop key={i} offset={`${offset}%`} stopColor={color} />;
  });
}

/** A four-point sparkle, centred on (0, 0). */
const SPARKLE = "M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z";
/** A small sakura petal, centred on (0, 0). */
const PETAL = "M0 5 C-4.6 1.8 -3.8 -4.2 -1.1 -5 L0 -3.5 L1.1 -5 C3.8 -4.2 4.6 1.8 0 5 Z";

/**
 * One tile of the drifting surface, spanning the planet's width. It is drawn twice side by
 * side and slides one tile per cycle, so the planet seems to turn.
 */
function SurfaceTile({ look, ids }: { look: PlanetLook; ids: Ids }) {
  const { x, y, r } = PLANET;
  const span = r * 2;
  const palette = look.palette;
  if (look.kind === "cyber") {
    // Data bands: dashed streams with packets riding them, and a few circuit traces.
    const rows = [-150, -96, -40, 18, 74, 130];
    return (
      <>
        {rows.map((dy, i) => (
          <g key={dy}>
            <line
              x1={x - r}
              x2={x + r}
              y1={y + dy}
              y2={y + dy}
              stroke={i % 2 ? look.bright : look.line}
              strokeOpacity={0.55}
              strokeWidth={i % 3 === 0 ? 3 : 1.6}
              strokeDasharray={i % 2 ? "2 9 18 9" : "26 6 4 6"}
            />
            {[0.12, 0.47, 0.8].map((t) => (
              <rect key={t} x={x - r + span * t + i * 13} y={y + dy - 3} width="10" height="6" fill={look.bright} opacity="0.75" />
            ))}
          </g>
        ))}
        {[
          [-170, -70, -120, -70, -100, -52, -30, -52],
          [10, 46, 60, 46, 78, 62, 150, 62],
          [-80, 104, -20, 104, 0, 120, 60, 120],
        ].map((p, i) => (
          <g key={i} stroke={look.line} strokeOpacity="0.7" fill="none">
            <polyline points={`${x + p[0]},${y + p[1]} ${x + p[2]},${y + p[3]} ${x + p[4]},${y + p[5]} ${x + p[6]},${y + p[7]}`} strokeWidth="1.5" />
            <circle cx={x + p[0]} cy={y + p[1]} r="3" fill={look.bright} stroke="none" />
            <circle cx={x + p[6]} cy={y + p[7]} r="3" fill={look.bright} stroke="none" />
          </g>
        ))}
      </>
    );
  }
  if (look.kind === "sakura") {
    // Soft, misty cloud bands: pearly ones and deeper twilight ones, never hard stripes.
    const mists = [
      { dy: -148, rx: 190, ry: 16, dx: -10, dark: false },
      { dy: -96, rx: 205, ry: 22, dx: 10, dark: true },
      { dy: -30, rx: 200, ry: 20, dx: 0, dark: false },
      { dy: 38, rx: 205, ry: 26, dx: -12, dark: true },
      { dy: 100, rx: 195, ry: 18, dx: 14, dark: false },
      { dy: 156, rx: 180, ry: 14, dx: 0, dark: true },
    ];
    return (
      <>
        {mists.map((m) => (
          <ellipse key={m.dy} cx={x + m.dx} cy={y + m.dy} rx={m.rx} ry={m.ry} fill={`url(#${m.dark ? ids.mistDark : ids.mist})`} />
        ))}
      </>
    );
  }
  if (look.kind === "ice") {
    // Crystalline frost bands with jagged edges, a few cracks, and glints of light on the ice.
    const band = (dy: number, h: number) => {
      const top: string[] = [];
      for (let k = 0; k <= 22; k++) top.push(`${x - r + k * 20},${y + dy + (k % 2 ? -4 : 4)}`);
      const bottom: string[] = [];
      for (let k = 22; k >= 0; k--) bottom.push(`${x - r + k * 20},${y + dy + h + (k % 2 ? 3 : -3)}`);
      return [...top, ...bottom].join(" ");
    };
    const bands = [
      { dy: -150, h: 22, color: look.line, o: 0.3 },
      { dy: -84, h: 30, color: look.body[1], o: 0.35 },
      { dy: -12, h: 18, color: look.line, o: 0.26 },
      { dy: 52, h: 34, color: look.body[1], o: 0.3 },
      { dy: 122, h: 20, color: look.line, o: 0.28 },
    ];
    const glints = [
      [-150, -120],
      [-60, -40],
      [40, -110],
      [120, 20],
      [-110, 70],
      [60, 140],
      [170, -60],
    ];
    return (
      <>
        {bands.map((b) => (
          <polygon key={b.dy} points={band(b.dy, b.h)} fill={b.color} opacity={b.o} />
        ))}
        <g stroke={look.line} strokeOpacity="0.4" strokeWidth="1" fill="none">
          <polyline points={`${x - 160},${y - 30} ${x - 120},${y - 10} ${x - 96},${y - 26} ${x - 60},${y - 4}`} />
          <polyline points={`${x + 30},${y + 80} ${x + 70},${y + 96} ${x + 96},${y + 84} ${x + 140},${y + 100}`} />
        </g>
        {glints.map(([dx, dy]) => (
          <path key={`${dx}${dy}`} d={SPARKLE} transform={`translate(${x + dx} ${y + dy}) scale(${0.8 + ((dx + 200) % 5) * 0.1})`} fill="#ffffff" opacity="0.85" />
        ))}
      </>
    );
  }
  // The classic gas giant: six bands and three storms.
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
  return (
    <>
      {bands.map((b) => (
        <rect key={b.dy} x={x - r} y={y + b.dy} width={span + 2} height={b.h} fill={b.color} opacity="0.85" />
      ))}
      {storms.map((s) => (
        <ellipse key={s.dx} cx={x + s.dx} cy={y + s.dy} rx={s.rx} ry={s.ry} fill={palette.storm} opacity="0.45" />
      ))}
    </>
  );
}

function Planet({ look, ids }: { look: PlanetLook; ids: Ids }) {
  const { x, y, r } = PLANET;
  const span = r * 2;
  return (
    <g>
      {look.kind === "ice" && <circle cx={x} cy={y} r={r + 44} fill={`url(#${ids.aurora})`} className="planet-aurora" />}
      <circle cx={x} cy={y} r={r + 26} fill={`url(#${ids.glow})`} className={look.kind === "cyber" ? "planet-pulse" : undefined} />
      <g clipPath={`url(#${ids.clip})`}>
        <circle cx={x} cy={y} r={r} fill={look.kind === "gas" ? look.palette.base : `url(#${ids.body})`} />
        <g transform={`rotate(${TILT_DEG} ${x} ${y})`}>
          {look.kind === "cyber" && (
            // A holographic wireframe: latitude rings and meridians, under the drifting data.
            <g fill="none" stroke={look.line} strokeWidth="1.2">
              {[-0.78, -0.52, -0.26, 0, 0.26, 0.52, 0.78].map((f) => {
                const dy = f * r;
                const rx = Math.sqrt(r * r - dy * dy);
                return <ellipse key={f} cx={x} cy={y + dy} rx={rx} ry={rx * 0.16} strokeOpacity={f === 0 ? 0.55 : 0.3} />;
              })}
              {[0.22, 0.5, 0.76, 0.94].map((f) => (
                <ellipse key={f} cx={x} cy={y} rx={r * f} ry={r} strokeOpacity="0.28" />
              ))}
              <line x1={x} x2={x} y1={y - r} y2={y + r} strokeOpacity="0.3" />
            </g>
          )}
          <g className="planet-spin">
            {[0, span].map((offset) => (
              <g key={offset} transform={`translate(${offset - r} 0)`}>
                <SurfaceTile look={look} ids={ids} />
              </g>
            ))}
          </g>
          {look.kind === "ice" && <ellipse cx={x} cy={y - r * 0.88} rx={r * 0.66} ry={r * 0.3} fill={`url(#${ids.cap})`} />}
        </g>
        <circle cx={x} cy={y} r={r} fill={`url(#${ids.shade})`} />
      </g>
      {/* A thin rim keeps the outline sharp over any background. */}
      <circle cx={x} cy={y} r={r} fill="none" style={{ stroke: look.palette.rim }} strokeOpacity="0.7" strokeWidth="2.5" />
    </g>
  );
}

const SPARKLE_ANGLES = { front: [24, 62, 104, 142, 168], back: [204, 248, 292, 330] };

function Rings({ half, look }: { half: "back" | "front"; look: PlanetLook }) {
  const [from, to] = half === "back" ? [180, 360] : [0, 180];
  const kind = look.kind;
  return (
    <g className="planet-rings">
      {RINGS.map((ring, i) => (
        <path
          key={ring.scale}
          d={arc(from, to, ring.scale)}
          fill="none"
          style={{ stroke: look.rings[i % 2] }}
          strokeOpacity={half === "back" ? ring.opacity * 0.6 : Math.min(1, ring.opacity * 1.5)}
          strokeWidth={kind === "sakura" ? ring.width * 1.3 : ring.width}
          strokeLinecap={kind === "sakura" ? "round" : undefined}
          // Code theme: telemetry dots on the inner track and dashes on the outer.
          strokeDasharray={kind === "cyber" ? (i === 0 ? "1 7" : i === 2 ? "10 4" : undefined) : undefined}
        />
      ))}
      {kind === "cyber" && (
        <>
          <path d={arc(from, to, 0.77)} fill="none" style={{ stroke: look.bright }} strokeOpacity={half === "back" ? 0.35 : 0.8} strokeWidth="1" />
          {half === "front" && (
            // A scanning pulse sweeping along the track.
            <path d={arc(0, 180, 0.73)} pathLength={100} fill="none" className="ring-scan" style={{ stroke: look.bright }} strokeWidth="4" strokeLinecap="round" strokeDasharray="7 100" />
          )}
        </>
      )}
      {kind === "sakura" && (
        // A silky sheen along the middle ribbon.
        <path d={arc(from, to, 0.73)} fill="none" stroke="#fff1f2" strokeOpacity={half === "back" ? 0.25 : 0.55} strokeWidth="1.6" />
      )}
      {kind === "ice" &&
        SPARKLE_ANGLES[half].map((a, i) => {
          const p = orbitPoint(a, 0.73);
          return (
            <path
              key={a}
              d={SPARKLE}
              transform={`translate(${p.x} ${p.y})`}
              fill="#ffffff"
              opacity={half === "back" ? 0.5 : 0.95}
              className="ice-twinkle"
              style={{ animationDelay: `${i * 0.45}s` }}
            />
          );
        })}
    </g>
  );
}

/** Sakura theme: petals drifting round the moon orbit. */
function OrbitPetals({ look }: { look: PlanetLook }) {
  const path = arc(0, 360);
  const colours = [look.rings[0], "#fbcfe8", "#fff1f2", look.rings[1], "#fbcfe8", "#fce7f3"];
  return (
    <g className="orbit-petals" aria-hidden="true">
      {colours.map((fill, i) => (
        <g key={i}>
          <animateMotion dur="26s" repeatCount="indefinite" rotate="auto" begin={`-${(i * 26) / colours.length}s`} path={path} />
          <path d={PETAL} fill={fill} opacity="0.85" transform={`scale(${1.4 + (i % 3) * 0.3})`} />
        </g>
      ))}
    </g>
  );
}

type Ids = { clip: string; shade: string; glow: string; halo: string; body: string; mist: string; mistDark: string; cap: string; aurora: string };

type Props = {
  topics: Topic[];
  palette: PlanetPalette;
  /** Only the planet holding the student's checkpoint shows the rocket. */
  showRocket?: boolean;
  /** "learn" moons open the topic's first lesson; "practice" moons open its practice set. */
  mode?: "learn" | "practice";
  /** Which lesson planet this is (0-based), so each gets its own hue within a theme. */
  index?: number;
};

/** Ringed planet with a moon orbit; each moon is a practice topic. */
export function PracticeOrbit({ topics, palette, showRocket = true, mode = "practice", index = 0 }: Props) {
  const calloutId = useId();
  const uid = useId();
  const ids: Ids = {
    clip: `${uid}clip`,
    shade: `${uid}shade`,
    glow: `${uid}glow`,
    halo: `${uid}halo`,
    body: `${uid}body`,
    mist: `${uid}mist`,
    mistDark: `${uid}mistdark`,
    cap: `${uid}cap`,
    aurora: `${uid}aurora`,
  };
  // The planet, rings and moons change with the theme world (and, for the default, the palette).
  const appearance = useAppearance();
  const look = planetLook(appearance.world, appearance.palette, index, palette);
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
            <stop offset="80%" style={{ stopColor: "var(--color-bg)" }} stopOpacity="0.55" />
            <stop offset="100%" style={{ stopColor: "var(--color-bg)" }} stopOpacity="0.85" />
          </radialGradient>
          <radialGradient id={ids.glow}>
            <stop offset="80%" style={{ stopColor: look.palette.glow }} stopOpacity={look.kind === "cyber" ? 0.5 : look.kind === "gas" ? 0.35 : 0.42} />
            <stop offset="100%" style={{ stopColor: look.palette.glow }} stopOpacity="0" />
          </radialGradient>
          {look.kind !== "gas" && (
            <radialGradient id={ids.body} cx={look.kind === "cyber" ? "50%" : "34%"} cy={look.kind === "cyber" ? "45%" : "30%"} r={look.kind === "cyber" ? "60%" : "78%"}>
              {bodyStops(look.body, look.kind)}
            </radialGradient>
          )}
          {look.kind === "sakura" && (
            <>
              <radialGradient id={ids.mist}>
                <stop offset="0%" stopColor={look.line} stopOpacity="0.6" />
                <stop offset="100%" stopColor={look.line} stopOpacity="0" />
              </radialGradient>
              <radialGradient id={ids.mistDark}>
                <stop offset="0%" stopColor={look.body[3]} stopOpacity="0.4" />
                <stop offset="100%" stopColor={look.body[3]} stopOpacity="0" />
              </radialGradient>
            </>
          )}
          {look.kind === "ice" && (
            <>
              <radialGradient id={ids.cap}>
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#f0f9ff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#f0f9ff" stopOpacity="0" />
              </radialGradient>
              {/* An aurora rim: cyan, emerald and frost blue just outside the planet. */}
              <radialGradient id={ids.aurora}>
                <stop offset="74%" stopColor="#22d3ee" stopOpacity="0" />
                <stop offset="83%" stopColor="#22d3ee" stopOpacity="0.4" />
                <stop offset="91%" stopColor="#34d399" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
              </radialGradient>
            </>
          )}
          <radialGradient id={ids.halo}>
            <stop offset="45%" style={{ stopColor: "var(--color-bg)" }} stopOpacity="0.9" />
            <stop offset="100%" style={{ stopColor: "var(--color-bg)" }} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Dark halo fades the background clouds near the planet, like a spotlight. */}
        <ellipse cx={PLANET.x} cy={PLANET.y + 10} rx={PLANET.r + 200} ry={PLANET.r + 60} fill={`url(#${ids.halo})`} />
        <Rings half="back" look={look} />
        <path d={arc(180, 360)} fill="none" style={{ stroke: look.orbit }} strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray={ORBIT_DASH[look.kind]} />
        <Planet look={look} ids={ids} />
        <Rings half="front" look={look} />
        <path d={arc(0, 180)} fill="none" style={{ stroke: look.orbit }} strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray={ORBIT_DASH[look.kind]} />
        {look.kind === "sakura" && <OrbitPetals look={look} />}
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
        const moon = locked ? look.locked : (look.moons[i] ?? look.moons[0]);
        const style = {
          left: pct(p.x, W),
          top: pct(p.y, H),
          width: pct(stop.size, W),
          background: moon.background,
          border: moon.border,
          // Locked moons keep the dim label colour from the stylesheet.
          color: locked ? undefined : moon.color,
          "--moon-glow": moon.glow,
        } as React.CSSProperties;
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
          "data-glow": moon.glow ? "" : undefined,
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
              <span
                className="block aspect-square w-full rounded-full"
                style={{ background: look.playground.background, border: look.playground.border }}
              />
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
