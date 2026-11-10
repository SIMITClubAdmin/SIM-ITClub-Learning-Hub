import type { Metadata } from "next";
import { Playground } from "@/components/learn/PlaygroundTools";

export const metadata: Metadata = { title: "CSS Playground · ITCamp Learning Hub" };

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-[96rem] flex-1 px-4 py-8 sm:px-8">
      {/* A dark veil keeps the homepage background very faint behind the content. */}
      <div className="quiz-backdrop pointer-events-none fixed inset-0" style={{ zIndex: -1 }} aria-hidden="true" />
      <Playground />
    </main>
  );
}
