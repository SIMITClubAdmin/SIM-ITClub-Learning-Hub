import type { Metadata } from "next";
import Link from "next/link";
import { PracticeGalaxy } from "@/components/practice/PracticeGalaxy";
import { MODULES } from "@/lib/topics";

export const metadata: Metadata = { title: "Practice · ITCamp Learning Hub" };

export default function PracticePage() {
  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-8">
      {/* A small corner label, so the planet is the first thing students look at. */}
      <div className="flex max-w-xs flex-col gap-2 lg:absolute lg:top-6 lg:left-8 lg:z-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">Practice</h1>
        <p className="text-sm text-dim">
          Each lesson is a planet. Score 70% on a moon to unlock the next one, and the rocket flies
          to your newest checkpoint.
        </p>
      </div>

      {/* Sized to fill the screen height, so the whole planet shows without scrolling. */}
      <div className="hidden flex-1 items-center justify-center sm:flex">
        <div
          className="w-full"
          style={{ maxWidth: "min(76rem, calc((100svh - 230px) * 800 / 520 * 1.19))" }}
        >
          <PracticeGalaxy modules={MODULES} />
        </div>
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
