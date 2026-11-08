import type { Metadata } from "next";
import { LeaderboardPlanet, type LeaderboardEntry } from "@/components/leaderboard/LeaderboardPlanet";

export const metadata: Metadata = { title: "Leaderboard · ITCamp Learning Hub" };
export const instant = false;

// Made-up names to preview the layout with ?demo, until real scores exist.
const DEMO: LeaderboardEntry[] = [
  { name: "Astro Ada", score: 1240 },
  { name: "Byte Ben", score: 1105 },
  { name: "Comet Cass", score: 980 },
  { name: "Dev Dana", score: 760 },
  { name: "Echo Eli", score: 540 },
];

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const { demo } = await searchParams;
  // TODO(Practice step): load real scores from Supabase.
  const entries: LeaderboardEntry[] = demo !== undefined ? DEMO : [];
  return (
    <main className="flex w-full flex-1 flex-col overflow-clip">
      <LeaderboardPlanet entries={entries} />
    </main>
  );
}
