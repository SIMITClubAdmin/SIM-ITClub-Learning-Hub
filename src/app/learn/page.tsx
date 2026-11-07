import type { Metadata } from "next";
import { SolarSystem } from "@/components/learn/SolarSystem";
import { TOPICS } from "@/lib/topics";

export const metadata: Metadata = { title: "Learn · ITCamp Learning Hub" };

export default function LearnPage() {
  return (
    <main className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-4 py-2 sm:px-8">
      <h1 className="sr-only">Learn</h1>
      <div className="flex flex-1 items-center">
        {/* Grows with the screen, but never so tall that the orbits need scrolling. */}
        <div className="mx-auto w-full" style={{ maxWidth: "calc((100svh - 130px) * 800 / 440 + 20rem)" }}>
          <SolarSystem topics={TOPICS} />
        </div>
      </div>
    </main>
  );
}
