"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { QUIZZES } from "@/lib/quizzes";
import type { CourseModule, PlanetPalette } from "@/lib/topics";

// Same scene as the Learn solar system: tilted orbits around a sun.
const W = 800;
const H = 440;
const SUN = { x: 400, y: 220, r: 70 };
const TILT = 0.38;
const ORBITS = [
  { rx: 165, size: 80, speed: 0.11, start: 200 },
  { rx: 268, size: 80, speed: 0.07, start: 330 },
  { rx: 365, size: 80, speed: 0.045, start: 80 },
];
const ZOOM = 2.3;
// Where the zoomed planet lands, as a % of the scene, leaving room for the panel.
const FOCUS = { x: 23, y: 50 };

function position(i: number, degrees: number) {
  const t = (degrees * Math.PI) / 180;
  const o = ORBITS[i % ORBITS.length];
  return { x: SUN.x + o.rx * Math.cos(t), y: SUN.y + o.rx * TILT * Math.sin(t), front: Math.sin(t) > 0 };
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

function Lock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" fill="currentColor" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Half of a tilted ring: the back half sits behind the planet, the front half over it. */
function Ring({ half, color }: { half: "back" | "front"; color: string }) {
  const sweep = half === "back" ? 1 : 0;
  return (
    <svg
      viewBox="0 0 200 100"
      className="practice-ring pointer-events-none absolute top-0 -left-1/2 h-full w-[200%] overflow-visible"
      aria-hidden="true"
    >
      <g transform="rotate(-10 100 50)" fill="none" stroke={color}>
        <path d={`M8 50 A92 15 0 0 ${sweep} 192 50`} strokeWidth="3" strokeOpacity={half === "back" ? 0.5 : 0.9} />
        <path d={`M18 50 A82 12 0 0 ${sweep} 182 50`} strokeWidth="1.2" strokeOpacity="0.45" />
      </g>
    </svg>
  );
}

/** A softly banded planet surface that drifts slowly, so the zoom has detail to land on. */
function PlanetSurface({ palette }: { palette: PlanetPalette }) {
  const uid = useId();
  const clip = `${uid}c`;
  const shade = `${uid}s`;
  // Wavy band edges; drawn twice side by side so the drift loops seamlessly.
  const bands = palette.bands.map((color, b) => {
    const y = 6 + b * 16;
    const h = 9 + (b % 3) * 3;
    const wave = (dx: number) =>
      `M${dx} ${y} q12.5 -3 25 0 t25 0 t25 0 t25 0 v${h} q-12.5 3 -25 0 t-25 0 t-25 0 t-25 0 z`;
    return (
      <g key={b} fill={color} opacity={0.35}>
        <path d={wave(0)} />
        <path d={wave(100)} />
      </g>
    );
  });
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
        <radialGradient id={shade} cx="32%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="80%" stopColor="#070b1f" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#070b1f" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="100" height="100" fill={palette.base} />
        <g className="surface-drift">{bands}</g>
        <rect width="100" height="100" fill={`url(#${shade})`} />
      </g>
    </svg>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((s) => (
        <svg key={s} viewBox="0 0 24 24" className={`size-4 ${s < count ? "text-accent" : "text-grid"}`} aria-hidden="true">
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

/**
 * One planet per lesson orbits a Practice sun. Clicking a planet zooms the camera
 * into it and lists that lesson's practice sets.
 */
export function PracticeSolarSystem({ modules }: { modules: CourseModule[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focus, setFocus] = useState({ x: 50, y: 50 });
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const angles = useRef(modules.map((_, i) => ORBITS[i % ORBITS.length].start));
  const paused = open !== null || hovered !== null;

  useEffect(() => {
    const place = () => {
      refs.current.forEach((el, i) => {
        if (!el) return;
        const p = position(i, angles.current[i]);
        el.style.left = pct(p.x, W);
        el.style.top = pct(p.y, H);
        el.style.zIndex = p.front ? "3" : "1";
        el.style.scale = p.front ? "1" : "0.85";
      });
    };
    place();
    if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(100, now - last) / 1000;
      last = now;
      angles.current = angles.current.map((a, i) => a + ORBITS[i % ORBITS.length].speed * 60 * dt);
      place();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  // Escape, or a click outside the planets and the panel, zooms back out.
  useEffect(() => {
    if (open === null) return;
    function onPointerDown(event: PointerEvent) {
      if (!(event.target as Element).closest(".solar-planet, #practice-panel")) setOpen(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(i: number) {
    if (open === i) return setOpen(null);
    const p = position(i, angles.current[i]);
    setFocus({ x: (p.x / W) * 100, y: (p.y / H) * 100 });
    setOpen(i);
  }

  const lesson = open === null ? null : modules[open];
  const zoomed = open !== null;

  return (
    <div className="relative w-full overflow-clip" style={{ aspectRatio: `${W} / ${H}` }}>
      <div
        className="practice-camera absolute inset-0"
        style={{
          transformOrigin: `${focus.x}% ${focus.y}%`,
          transform: zoomed ? `translate(${FOCUS.x - focus.x}%, ${FOCUS.y - focus.y}%) scale(${ZOOM})` : "none",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={`absolute inset-0 size-full transition-opacity duration-500 ${zoomed ? "opacity-0" : ""}`}
          aria-hidden="true"
        >
          {ORBITS.slice(0, modules.length).map((o) => (
            <ellipse
              key={o.rx}
              cx={SUN.x}
              cy={SUN.y}
              rx={o.rx}
              ry={o.rx * TILT}
              fill="none"
              stroke="#94aaff"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
          ))}
        </svg>
        <div
          className={`absolute z-2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-sm font-semibold text-bg transition-opacity duration-500 ${
            zoomed ? "opacity-0" : ""
          }`}
          style={{
            left: pct(SUN.x, W),
            top: pct(SUN.y, H),
            width: pct(SUN.r * 2, W),
            aspectRatio: "1",
            backgroundImage: "radial-gradient(circle at 40% 38%, #fff6d8, #ffc46b 55%, #f08a3c)",
            boxShadow: "0 0 60px 20px rgb(255 179 71 / 0.35)",
          }}
          aria-hidden="true"
        >
          PRACTICE
        </div>

        {modules.map((m, i) => (
          <button
            key={m.slug}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            aria-expanded={open === i}
            aria-controls="practice-panel"
            aria-label={`Lesson ${m.number} practice: ${m.title}${m.lockedReason ? ", locked" : ""}`}
            onClick={() => toggle(i)}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            inert={zoomed && open !== i}
            className={`solar-planet absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full font-mono text-sm font-medium text-ink transition-opacity duration-500 ${
              open === i ? "is-open is-zoomed" : ""
            } ${zoomed && open !== i ? "opacity-0" : ""}`}
            style={{
              width: pct(ORBITS[i % ORBITS.length].size, W),
              filter: m.lockedReason ? "saturate(0.55) brightness(0.8)" : undefined,
            }}
          >
            {open === i && <Ring half="back" color={m.palette.ring} />}
            <PlanetSurface palette={m.palette} />
            {open === i && <Ring half="front" color={m.palette.ring} />}
            <span
              className={`relative drop-shadow-[0_1px_2px_rgb(7_11_31)] ${open === i ? "font-display text-[0.8rem] font-semibold" : ""}`}
            >
              {open === i ? `Lesson ${m.number}` : `L${m.number}`}
            </span>
            {m.lockedReason && <Lock className="relative mt-0.5 size-3 text-dim" />}
          </button>
        ))}
      </div>

      {lesson && (
        <aside
          id="practice-panel"
          aria-live="polite"
          className="practice-panel absolute top-1/2 z-10 max-h-[92%] -translate-y-1/2 overflow-y-auto border border-violet bg-bg/90 p-5"
          // Set inline so the panel keeps its place on the right even if the page has stale CSS.
          style={{ right: "1.5%", width: "min(34rem, 52%)" }}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            className="font-mono text-xs tracking-wider text-dim uppercase hover:text-accent"
          >
            ← All lessons
          </button>
          <p className="mt-3 font-mono text-xs tracking-wider text-accent uppercase">Lesson {lesson.number} practice</p>
          <h2 className="mt-1 text-3xl font-semibold">{lesson.title}</h2>
          {lesson.lockedReason && (
            <p className="mt-2 flex items-center gap-2 text-sm text-dim">
              <Lock className="size-4" />
              {lesson.lockedReason}
            </p>
          )}
          {/* TODO(Practice step): read stars and best scores from the member's real attempts. */}
          <div className="mt-4">
            <div className="flex justify-between font-mono text-[11px] tracking-wider text-dim uppercase">
              <span>Missions cleared</span>
              <span>0 / {lesson.topics.length}</span>
            </div>
            <div className="mt-1.5 h-1.5 bg-grid">
              <div className="h-full bg-accent" style={{ width: "0%" }} />
            </div>
          </div>
          <ol className="mt-5 flex flex-col gap-3">
            {lesson.topics.map((topic, ti) => {
              const locked = lesson.lockedReason ?? topic.lockedReason;
              return (
                <li
                  key={topic.slug}
                  className={`border p-4 ${locked ? "border-grid bg-bg/60" : "border-violet bg-violet/10"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[11px] tracking-wider text-accent uppercase">
                      Mission {String(ti + 1).padStart(2, "0")}
                    </p>
                    <Stars count={0} />
                  </div>
                  <p className={`mt-1 font-display text-xl font-semibold ${locked ? "text-dim" : ""}`}>{topic.name}</p>
                  <p className="mt-1 text-sm text-dim">{topic.summary}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-dim">{locked ? "" : "Best: not attempted"}</span>
                    {locked ? (
                      <span className="flex items-center gap-1.5 font-mono text-xs text-dim">
                        <Lock className="size-3.5" />
                        {locked}
                      </span>
                    ) : topic.slug in QUIZZES ? (
                      <Link href={`/practice/${topic.slug}`} className="cta">
                        Launch
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-dim">Coming soon</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>
      )}
    </div>
  );
}
