import type { Metadata } from "next";
import Link from "next/link";
import { PracticeGalaxy } from "@/components/practice/PracticeGalaxy";
import { MODULES } from "@/lib/topics";

export const metadata: Metadata = { title: "Practice · ITCamp Learning Hub" };

export default function PracticePage() {
  return (
    // overflow-clip lets the next lessons' planets peek in from the corners. Unlike
    // overflow-hidden it cannot be scrolled, so moving focus never shifts the page.
    <main className="relative flex w-full flex-1 flex-col overflow-clip px-4 py-6 sm:px-8">
      {/* A small corner label, so the planet is the first thing students look at. */}
      <div className="relative z-20 flex max-w-xs flex-col gap-2 lg:absolute lg:top-6 lg:left-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">Practice</h1>
        <p className="text-sm text-dim">
          Each lesson is a planet. Score 70% on a moon to unlock the next one, and the rocket flies
          to your newest checkpoint.
        </p>
      </div>

      {/* The stage fills the screen; each planet is sized to fit its height. */}
      <div
        className="hidden min-h-[34rem] flex-1 flex-col sm:flex"
        style={{ "--planet-width": "min(60rem, calc((100svh - 230px) * 800 / 520))" } as React.CSSProperties}
      >
        <PracticeGalaxy modules={MODULES} />
      </div>

      {/* The orbit needs room for its callout, so small screens get a list instead. */}
      <div className="mt-6 flex flex-col gap-6 sm:hidden">
        {MODULES.map((module) => (
          <section key={module.slug} className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-wider text-accent uppercase">
              Lesson {module.number}: {module.title}
            </h2>
            <ul className="flex flex-col gap-3">
              {module.topics.map((topic) => (
                <li key={topic.slug} className="border border-violet bg-bg/85 p-4">
                  {topic.lockedReason ? (
                    <div aria-disabled="true">
                      <p className="font-display text-xl font-semibold text-dim">
                        {topic.name} (locked)
                      </p>
                      <p className="mt-1 text-sm text-dim">{topic.lockedReason}</p>
                    </div>
                  ) : (
                    <Link href={`/practice/${topic.slug}`} className="block">
                      <p className="font-display text-xl font-semibold">{topic.name}</p>
                      <p className="mt-1 text-sm text-dim">{topic.summary}</p>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
