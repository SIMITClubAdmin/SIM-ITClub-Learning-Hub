import type { Metadata } from "next";
import Link from "next/link";
import { PracticeGalaxy } from "@/components/practice/PracticeGalaxy";
import { MODULES } from "@/lib/topics";

export const metadata: Metadata = { title: "Practice · ITCamp Learning Hub" };

export default function PracticePage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 py-6 sm:px-8">
      <h1 className="sr-only">Practice</h1>

      {/* The stage covers the whole window behind the header, so planets drift under the
          logo with no hard edge. overflow-clip lets corner planets peek in without ever
          scrolling the page. */}
      <div
        className="fixed inset-0 z-0 hidden flex-col overflow-clip pt-24 pb-4 sm:flex"
        style={{ "--planet-width": "min(64rem, calc((100svh - 170px) * 800 / 520))" } as React.CSSProperties}
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
