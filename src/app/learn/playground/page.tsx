import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import { Playground } from "@/components/learn/PlaygroundTools";

export const metadata: Metadata = { title: "CSS Playground · ITCamp Learning Hub" };

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-[96rem] flex-1 px-4 py-8 sm:px-8">
      <PageVeil />
      <Playground />
    </main>
  );
}
