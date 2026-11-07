import type { Metadata } from "next";
import { SolarSystem } from "@/components/learn/SolarSystem";
import { TOPICS } from "@/lib/topics";

export const metadata: Metadata = { title: "Learn · ITCamp Learning Hub" };

export default function LearnPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-3xl font-semibold sm:text-4xl">Learn</h1>
        <p className="text-sm text-dim">
          Lesson 1 is a small solar system. Each planet is a topic, and every lesson is open to read.
        </p>
      </div>
      <div className="flex flex-1 items-center">
        <div className="w-full">
          <SolarSystem topics={TOPICS} />
        </div>
      </div>
    </main>
  );
}
