import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { BigLock } from "@/components/auth/BigLock";
import { CtaButton } from "@/components/effects/CtaButton";
import { LeaderboardPlanet, type LeaderboardEntry } from "@/components/leaderboard/LeaderboardPlanet";
import { isClubAccount } from "@/lib/club-account";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Leaderboard · ITCamp Learning Hub" };
export const instant = false;

// Made-up names to preview the layout with ?demo, until real scores exist.
const DEMO: LeaderboardEntry[] = [
  { name: "Astro Ada", score: 1240 },
  { name: "Byte Ben", score: 1105 },
  { name: "Comet Cass", score: 980 },
  { name: "Dev Dana", score: 760 },
  { name: "Echo Eli", score: 540 },
  { name: "Flux Fay", score: 495 },
  { name: "Glitch Gus", score: 430 },
  { name: "Hex Hana", score: 380 },
  { name: "Ion Ivy", score: 290 },
  { name: "Jet Jo", score: 210 },
];

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const { demo } = await searchParams;
  // Up to 100 points per quiz (best score / total); club members only, EXCO and guests left out (see get_leaderboard).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Only club accounts (subcomms, EXCO and above) can see the leaderboard.
  if (!isClubAccount(user)) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <section className="w-full border border-violet bg-bg/90 p-6 shadow-[0_0_60px_10px_rgb(109_74_255_/_0.25)] sm:p-8">
          <BigLock />
          <p className="mt-4 font-mono text-xs tracking-wider text-accent uppercase">Club members only</p>
          {user ? (
            <>
              <p className="mt-1 mb-6 text-dim">
                The leaderboard is for SIM IT Club members. You can still learn and take every Practice mission.
              </p>
              <CtaButton href="/practice">Go to Practice</CtaButton>
            </>
          ) : (
            <>
              <p className="mt-1 mb-6 text-dim">Log in with your club account to see the leaderboard.</p>
              <AuthForm mode="login" next="/leaderboard" />
            </>
          )}
        </section>
      </main>
    );
  }

  const { data } =
    demo !== undefined ? { data: null } : await supabase.schema("learning_hub").rpc("get_leaderboard");
  const entries: LeaderboardEntry[] =
    demo !== undefined
      ? DEMO
      : ((data ?? []) as { display_name: string; points: number }[]).map((row) => ({
          name: row.display_name,
          score: row.points,
        }));
  return (
    <main className="flex w-full flex-1 flex-col">
      <LeaderboardPlanet entries={entries} />
    </main>
  );
}
