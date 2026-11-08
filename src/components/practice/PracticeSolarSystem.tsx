"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CourseModule } from "@/lib/topics";

// Same scene as the Learn solar system: tilted orbits around a sun.
const W = 800;
const H = 440;
const SUN = { x: 400, y: 220, r: 70 };
const TILT = 0.38;
const ORBITS = [
  { rx: 165, size: 66, speed: 0.11, start: 200 },
  { rx: 268, size: 80, speed: 0.07, start: 330 },
  { rx: 365, size: 92, speed: 0.045, start: 80 },
];
const ZOOM = 3.2;
// Where the zoomed planet lands, as a % of the scene, leaving room for the panel.
const FOCUS = { x: 28, y: 50 };
const LEVELS = ["Easy", "Medium", "Hard"];

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
              backgroundImage: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.4), ${m.palette.bands[0]} 40%, ${m.palette.base} 70%, rgb(7 11 31 / 0.9))`,
              filter: m.lockedReason ? "saturate(0.55) brightness(0.8)" : undefined,
            }}
          >
            L{m.number}
            {m.lockedReason && <Lock className="mt-0.5 size-3 text-dim" />}
          </button>
        ))}
      </div>

      {lesson && (
        <aside
          id="practice-panel"
          aria-live="polite"
          className="practice-panel absolute top-1/2 right-[4%] z-10 max-h-[92%] w-[min(24rem,44%)] -translate-y-1/2 overflow-y-auto border border-violet bg-bg/90 p-5"
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
          <ul className="mt-4 flex flex-col gap-4">
            {lesson.topics.map((topic) => {
              const locked = lesson.lockedReason ?? topic.lockedReason;
              return (
                <li key={topic.slug}>
                  <p className="font-display text-lg font-semibold">{topic.name}</p>
                  <div className="mt-1.5 flex gap-2">
                    {LEVELS.map((level, li) => {
                      // TODO(Practice step): unlock levels from the member's real scores.
                      const open = !locked && li === 0;
                      const cls = "flex-1 border px-2 py-1.5 text-center font-mono text-xs tracking-wider uppercase";
                      return open ? (
                        <Link
                          key={level}
                          href={`/practice/${topic.slug}?level=${level.toLowerCase()}`}
                          className={`${cls} border-accent text-accent hover:bg-accent hover:text-bg`}
                        >
                          {level}
                        </Link>
                      ) : (
                        <span key={level} aria-disabled="true" className={`${cls} flex items-center justify-center gap-1 border-grid text-dim/70`}>
                          <Lock className="size-3" />
                          {level}
                        </span>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      )}
    </div>
  );
}
