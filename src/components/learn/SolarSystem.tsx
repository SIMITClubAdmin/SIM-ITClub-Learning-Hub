"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Topic } from "@/lib/topics";

// Scene size; the orbits are tilted ellipses around the sun.
const W = 800;
const H = 480;
const SUN = { x: 400, y: 240, r: 58 };
const TILT = 0.36;
const PLANETS = [
  { rx: 150, size: 54, speed: 0.11, start: 200, color: "#be3caa" },
  { rx: 245, size: 66, speed: 0.07, start: 330, color: "#4f6cf0" },
  { rx: 345, size: 76, speed: 0.045, start: 80, color: "#1ea3c0" },
];

function position(i: number, degrees: number) {
  const t = (degrees * Math.PI) / 180;
  const p = PLANETS[i];
  return { x: SUN.x + p.rx * Math.cos(t), y: SUN.y + p.rx * TILT * Math.sin(t), front: Math.sin(t) > 0 };
}

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

/** Three topic planets orbit a sun. Orbits pause while a planet is hovered or open. */
export function SolarSystem({ topics }: { topics: Topic[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const angles = useRef(PLANETS.map((p) => p.start));
  const paused = open !== null || hovered !== null;

  useEffect(() => {
    const place = () => {
      refs.current.forEach((el, i) => {
        if (!el) return;
        const p = position(i, angles.current[i]);
        el.style.left = pct(p.x, W);
        el.style.top = pct(p.y, H);
        // Planets behind the sun go under it and shrink a little, for depth.
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
      angles.current = angles.current.map((a, i) => a + PLANETS[i].speed * 60 * dt);
      place();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  const topic = open === null ? null : topics[open];

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden="true">
          {PLANETS.map((p) => (
            <ellipse
              key={p.rx}
              cx={SUN.x}
              cy={SUN.y}
              rx={p.rx}
              ry={p.rx * TILT}
              fill="none"
              stroke="#94aaff"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
          ))}
        </svg>
        <div
          className="sun absolute z-2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-xs font-medium text-bg"
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
          LESSON 1
        </div>

        {topics.map((t, i) => (
          <button
            key={t.slug}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            aria-expanded={open === i}
            aria-controls="topic-panel"
            onClick={() => setOpen(open === i ? null : i)}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(null)}
            className={`solar-planet absolute flex aspect-square -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-sm font-medium text-ink ${
              open === i ? "is-open" : ""
            }`}
            style={{
              width: pct(PLANETS[i].size, W),
              backgroundImage: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / 0.35), ${PLANETS[i].color} 45%, rgb(7 11 31 / 0.9))`,
            }}
          >
            {t.short}
          </button>
        ))}
      </div>

      <aside
        id="topic-panel"
        aria-live="polite"
        className="min-h-64 border border-violet bg-bg/90 p-5"
      >
        {topic ? (
          <>
            <p className="font-mono text-xs tracking-wider text-accent uppercase">
              {topic.lessons.length} lessons
            </p>
            <h2 className="mt-1 text-3xl font-semibold">{topic.name}</h2>
            <p className="mt-2 text-sm text-dim">{topic.summary}</p>
            <ol className="mt-4 flex flex-col gap-1">
              {topic.lessons.map((lesson, i) => (
                <li key={lesson.title}>
                  {lesson.href ? (
                    <Link
                      href={lesson.href}
                      className="flex items-baseline gap-3 py-1.5 hover:text-accent"
                    >
                      <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                      {lesson.title}
                    </Link>
                  ) : (
                    <span className="flex items-baseline gap-3 py-1.5 text-dim/70">
                      <span className="font-mono text-xs">{String(i + 1).padStart(2, "0")}</span>
                      {lesson.title}
                      <span className="ml-auto font-mono text-[10px] tracking-wider uppercase">Soon</span>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="flex h-full flex-col justify-center gap-2 text-dim">
            <p className="font-display text-xl font-semibold text-ink">Pick a planet</p>
            <p className="text-sm">
              Every topic is open. Click a planet to see its lessons. The orbits pause while you look.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
