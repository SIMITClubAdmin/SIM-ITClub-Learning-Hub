import Link from "next/link";
import { CtaButton } from "@/components/effects/CtaButton";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-16 text-center">
      <h1 className="max-w-[16ch] text-4xl font-medium tracking-tight text-balance sm:text-6xl">
        What would you like to do today?
      </h1>
      <div className="flex flex-wrap justify-center gap-10">
        <CtaButton href="/learn" size="lg">
          Learn
        </CtaButton>
        <CtaButton href="/practice" size="lg">
          Practice
        </CtaButton>
      </div>
      <Link href="/leaderboard" className="text-dim underline underline-offset-4">
        View the leaderboard
      </Link>
    </main>
  );
}
