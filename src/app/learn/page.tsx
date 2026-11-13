import type { Metadata } from "next";
import Link from "next/link";
import { needsFullPageLoad } from "@/components/git-studio/isolation";
import { PracticeGalaxy } from "@/components/practice/PracticeGalaxy";
import { MODULES } from "@/lib/topics";

export const metadata: Metadata = { title: "Learn · ITCamp Learning Hub" };

// The Git planet opens the Git & GitHub studio, so it is open here even though it stays
// locked in Challenge (no Git quizzes yet). Each moon jumps to its part of the page.
const GIT_MOON_LESSONS: Record<string, { title: string; href: string }[]> = {
  "git-basics": [
    { title: "Introduction to Git & GitHub", href: "/learn/git/introduction" },
    { title: "The core workflow", href: "/learn/git/core-workflow" },
  ],
  branches: [
    { title: "Branching & merging", href: "/learn/git/branching" },
    { title: "Pull requests & merge conflicts", href: "/learn/git/pull-requests-conflicts" },
  ],
  github: [
    { title: "Working with GitHub", href: "/learn/git/working-with-github" },
    { title: "Tips & cheatsheet", href: "/learn/git/tips-cheatsheet" },
  ],
};

// Learn is for reference during class, so topics are never locked here; locks only apply in Practice.
// Lessons whose planet is locked stay locked, since their content does not exist yet.
const LEARN_MODULES = MODULES.map((module) =>
  module.slug === "git"
    ? {
        ...module,
        lockedReason: null,
        topics: module.topics.map((topic) => ({ ...topic, lockedReason: null, lessons: GIT_MOON_LESSONS[topic.slug] ?? topic.lessons })),
      }
    : {
        ...module,
        topics: module.lockedReason ? module.topics : module.topics.map((topic) => ({ ...topic, lockedReason: null })),
      },
);

// The wheel still opens on Lesson 1, where the rocket follows the HTML, CSS and JS trail.
const START_PLANET = Math.max(0, LEARN_MODULES.findIndex((module) => module.slug === "web-basics"));

export default function LearnPage() {
  return (
    <main className="flex w-full flex-1 flex-col px-4 py-6 sm:px-8">
      <h1 className="sr-only">Learn</h1>

      {/* The stage covers the whole window behind the header, so planets drift under the
          logo with no hard edge. overflow-clip lets corner planets peek in without ever
          scrolling the page. */}
      <div
        className="fixed inset-0 z-0 hidden flex-col overflow-clip pt-24 pb-4 sm:flex"
        style={{ "--planet-width": "min(64rem, calc((100svh - 170px) * 800 / 520))" } as React.CSSProperties}
      >
        <PracticeGalaxy modules={LEARN_MODULES} mode="learn" startAt={START_PLANET} />
      </div>


      {/* The orbit needs room for its callout, so small screens get a list instead. */}
      {/* On wider screens the CSS Playground is a small planet beside the CSS moon. */}
      <div className="mt-6 flex flex-col gap-6 sm:hidden">
        <Link href="/learn/playground" className="block border border-accent bg-bg/85 p-4">
          <p className="font-mono text-xs tracking-wider text-accent uppercase">New · Try it live</p>
          <p className="mt-1 font-display text-xl font-semibold">CSS Playground</p>
          <p className="mt-1 text-sm text-dim">Play with colours, boxes and selectors, then copy the CSS.</p>
        </Link>
        {LEARN_MODULES.map((module) => (
          <section key={module.slug} className="flex flex-col gap-3">
            <h2 className="font-mono text-xs tracking-wider text-accent uppercase">
              Lesson {module.number}: {module.title}
            </h2>
            <ul className="flex flex-col gap-3">
              {module.topics.map((topic) => {
                const href = topic.lessons.find((l) => l.href)?.href;
                return (
                  <li key={topic.slug} className="border border-violet bg-bg/85 p-4">
                    {href && !topic.lockedReason && needsFullPageLoad(href) ? (
                      // The Git studio needs a full page load to get its isolation headers.
                      <a href={href} className="block">
                        <p className="font-display text-xl font-semibold">{topic.name}</p>
                        <p className="mt-1 text-sm text-dim">{topic.summary}</p>
                      </a>
                    ) : href && !topic.lockedReason ? (
                      <Link href={href} className="block">
                        <p className="font-display text-xl font-semibold">{topic.name}</p>
                        <p className="mt-1 text-sm text-dim">{topic.summary}</p>
                      </Link>
                    ) : (
                      <div aria-disabled="true">
                        <p className="font-display text-xl font-semibold text-dim">{topic.name} (locked)</p>
                        <p className="mt-1 text-sm text-dim">{topic.lockedReason ?? "Lessons coming soon"}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
