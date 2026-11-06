import type { Metadata } from "next";
import Link from "next/link";
import { PracticeOrbit } from "@/components/practice/PracticeOrbit";
import { TOPICS } from "@/lib/topics";

export const metadata: Metadata = { title: "Practice · ITCamp Learning Hub" };

export default function PracticePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-8 sm:px-8">
      <h1 className="text-5xl font-semibold sm:text-6xl">Practice</h1>

      {/* The orbit needs room for its callout, so small screens get a list instead. */}
      <div className="hidden sm:block">
        <PracticeOrbit topics={TOPICS} />
      </div>

      <ul className="flex flex-col gap-3 sm:hidden">
        {TOPICS.map((topic) => (
          <li key={topic.slug} className="border border-violet bg-bg/85 p-4">
            {topic.lockedReason ? (
              <div aria-disabled="true">
                <p className="text-xl font-semibold text-dim">{topic.name} (locked)</p>
                <p className="mt-1 text-sm text-dim">{topic.lockedReason}</p>
              </div>
            ) : (
              <Link href={`/practice/${topic.slug}`} className="block">
                <p className="text-xl font-semibold">{topic.name}</p>
                <p className="mt-1 text-sm text-dim">{topic.summary}</p>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
