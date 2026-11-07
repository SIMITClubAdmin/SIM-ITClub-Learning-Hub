"use client";

import { useState } from "react";
import type { CourseModule } from "@/lib/topics";
import { PracticeOrbit } from "./PracticeOrbit";

function Arrow({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`size-5 ${flip ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const NAV_BUTTON =
  "flex size-11 items-center justify-center border border-ink transition-colors hover:border-accent hover:bg-accent hover:text-bg disabled:pointer-events-none disabled:opacity-30";

/** One planet per lesson. The view pans sideways between planets like a camera. */
export function PracticeGalaxy({ modules }: { modules: CourseModule[] }) {
  // The rocket lives on the newest open lesson.
  const checkpoint = Math.max(0, modules.findLastIndex((m) => !m.lockedReason));
  const [index, setIndex] = useState(checkpoint);
  const current = modules[index];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setIndex((i) => i - 1)}
          disabled={index === 0}
          aria-label="Previous lesson planet"
          className={NAV_BUTTON}
        >
          <Arrow />
        </button>
        <div className="min-w-56 text-center" aria-live="polite">
          <p className="font-mono text-xs tracking-wider text-accent uppercase">
            Lesson {current.number} of {modules.length}
          </p>
          <p className="font-display text-xl font-semibold">{current.title}</p>
          {current.lockedReason && <p className="text-sm text-dim">{current.lockedReason}</p>}
        </div>
        <button
          type="button"
          onClick={() => setIndex((i) => i + 1)}
          disabled={index === modules.length - 1}
          aria-label="Next lesson planet"
          className={NAV_BUTTON}
        >
          <Arrow flip />
        </button>
      </div>

      <div className="overflow-hidden">
        <div
          className="galaxy-track flex"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {modules.map((module, i) => (
            <div
              key={module.slug}
              inert={i !== index}
              aria-hidden={i !== index}
              className={`galaxy-slide w-full shrink-0 px-[8%] ${i === index ? "" : "is-away"} ${
                module.lockedReason ? "is-locked" : ""
              }`}
            >
              <PracticeOrbit
                topics={module.topics}
                palette={module.palette}
                showRocket={i === checkpoint}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        {modules.map((module, i) => (
          <button
            key={module.slug}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Lesson ${module.number}: ${module.title}`}
            aria-current={i === index ? "true" : undefined}
            className={`size-2.5 transition-colors ${i === index ? "bg-accent" : "bg-violet hover:bg-dim"}`}
          />
        ))}
      </div>
    </div>
  );
}
