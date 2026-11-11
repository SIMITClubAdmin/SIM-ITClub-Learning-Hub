import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import Link from "next/link";
import { EventLabFrame } from "@/components/learn/EventLabFrame";

export const metadata: Metadata = { title: "JS Event Lab · ITCamp Learning Hub" };

export default function EventLabPage() {
  return (
    <main className="mx-auto w-full max-w-[80rem] flex-1 px-0 py-4 sm:px-4">
      <PageVeil />
      <Link href="/learn/javascript" className="ml-4 font-mono text-xs tracking-wider text-dim uppercase hover:text-accent">
        ← JavaScript lessons
      </Link>
      <EventLabFrame />
    </main>
  );
}
