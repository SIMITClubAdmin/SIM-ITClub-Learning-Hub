"use client";

import { useEffect, useRef, useState } from "react";
import type { CourseModule } from "@/lib/topics";
import { PracticeOrbit } from "./PracticeOrbit";

const SPIN_MS = 1200;
// How far the planets behind the current one sit from the centre, as a % of the stage.
const SPREAD_X = 60;
const SPREAD_Y = 60;

/**
 * Where a planet sits on the wheel. a = 0 is the front, in the middle of the screen.
 * The rest recede along a diagonal: the next lesson peeks in at the top left,
 * the one after at the bottom right.
 */
function placement(a: number) {
  const s = Math.sin(a);
  const depth = (Math.cos(a) + 1) / 2; // 1 at the front, 0 at the very back
  return {
    x: 50 - s * SPREAD_X,
    y: 50 - s * SPREAD_Y,
    scale: 0.5 + depth * 0.5,
    z: Math.round(depth * 10),
    front: depth > 0.98,
  };
}

function wrap(value: number, n: number) {
  return ((value % n) + n) % n;
}

function Arrow({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-5 ${flip ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const NAV_BUTTON =
  "flex size-11 items-center justify-center border border-ink bg-bg/80 transition-colors hover:border-accent hover:bg-(--accent-primary) hover:text-(--accent-on-primary)";

/** One planet per lesson, on a wheel that rotates the chosen planet to the front. */
export function PracticeGalaxy({
  modules,
  mode = "practice",
  startAt,
}: {
  modules: CourseModule[];
  mode?: "learn" | "practice";
  /** The planet that starts in front and carries the rocket. Defaults to the newest open lesson. */
  startAt?: number;
}) {
  const n = modules.length;
  // The rocket lives on the newest open lesson, unless the page picks one.
  const checkpoint = startAt ?? Math.max(0, modules.findLastIndex((m) => !m.lockedReason));
  const [target, setTarget] = useState(checkpoint);
  // A continuous position on the wheel, so planets glide along the curve between stops.
  const [spin, setSpin] = useState(checkpoint);
  const spinRef = useRef(checkpoint);

  useEffect(() => {
    const from = spinRef.current;
    // Go the short way round the wheel.
    let delta = wrap(target - from, n);
    if (delta > n / 2) delta -= n;
    if (Math.abs(delta) < 0.001) return;
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : SPIN_MS;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      spinRef.current = from + delta * eased;
      setSpin(spinRef.current);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, n]);

  const current = modules[wrap(target, n)];
  const go = (index: number) => setTarget(wrap(index, n));

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="relative z-20 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={() => go(target - 1)} aria-label="Previous lesson" className={NAV_BUTTON}>
          <Arrow />
        </button>
        <div className="min-w-56 text-center" aria-live="polite">
          <p className="font-mono text-xs tracking-wider text-accent uppercase">
            Lesson {current.number} of {n}
          </p>
          <p className="font-display text-xl font-semibold">{current.title}</p>
          {current.lockedReason && <p className="text-sm text-dim">{current.lockedReason}</p>}
        </div>
        <button type="button" onClick={() => go(target + 1)} aria-label="Next lesson" className={NAV_BUTTON}>
          <Arrow flip />
        </button>
      </div>

      <div className="relative flex-1">
        {modules.map((module, i) => {
          const a = ((i - spin) / n) * 2 * Math.PI;
          const p = placement(a);
          const isTarget = wrap(target, n) === i;
          const interactive = isTarget && p.front;
          return (
            <div
              key={module.slug}
              className={`galaxy-planet absolute ${module.lockedReason ? "is-locked" : ""}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                zIndex: p.z,
                transform: `translate(-50%, -50%) scale(${p.scale})`,
                opacity: 0.35 + p.scale * 0.65,
              }}
            >
              <div inert={!interactive} aria-hidden={!interactive}>
                <PracticeOrbit
                  topics={module.topics}
                  palette={module.palette}
                  showRocket={i === checkpoint}
                  mode={mode}
                  index={i}
                />
              </div>
              {/* A planet waiting at the edge can be clicked to rotate it in. */}
              {!isTarget && (
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to lesson ${module.number}: ${module.title}`}
                  className="absolute inset-[18%] rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
