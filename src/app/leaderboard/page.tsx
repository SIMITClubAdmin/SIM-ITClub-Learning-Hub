import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { BigLock } from "@/components/auth/BigLock";
import { LeaderboardPlanet, type LeaderboardEntry } from "@/components/leaderboard/LeaderboardPlanet";
import { cleanTagline, sortBoard, type BoardRow } from "@/lib/leaderboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Leaderboard · ITCamp Learning Hub" };
export const instant = false;

// Made-up names to preview the layout with ?demo, until real scores exist.
const DEMO: LeaderboardEntry[] = [
  { name: "Astro Ada", score: 1240, tagline: "Commit early, push often" },
  { name: "Byte Ben", score: 1105, tagline: "Merge conflicts fear me" },
  { name: "Comet Cass", score: 980, tagline: "git push --to-the-moon" },
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
  // One point per correct answer in each member's best attempt, over every quiz. Admins left out (see get_leaderboard).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Only registered members can see the leaderboard; guests and visitors get the lock.
  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
        <section className="w-full border border-violet bg-bg/90 p-6 shadow-[0_0_60px_10px_rgb(109_74_255_/_0.25)] sm:p-8">
          <BigLock />
          <p className="mt-4 font-mono text-xs tracking-wider text-accent uppercase">Members only</p>
          <p className="mt-1 mb-6 text-dim">
            Log in to see the leaderboard. Guests can still read the notes and try every challenge.
          </p>
          <AuthForm mode="login" next="/leaderboard" />
        </section>
      </main>
    );
  }

  const { data } =
    demo !== undefined ? { data: null } : await supabase.rpc("get_leaderboard");
  let entries: LeaderboardEntry[] = DEMO;
  if (demo === undefined) {
    const rows = sortBoard((data ?? []) as BoardRow[]);
    // Only the top 3 show a tagline: an incentive to climb.
    const taglines = await topTaglines(rows.slice(0, 3).map((r) => r.display_name));
    entries = rows.map((row, i) => ({
      name: row.display_name,
      score: row.points,
      tagline: i < 3 ? taglines.get(row.display_name) : undefined,
    }));
  }
  return (
    <main className="flex w-full flex-1 flex-col">
      <LeaderboardPlanet entries={entries} />
    </main>
  );
}

/**
 * The taglines the top 3 set on their account page. They live in each member's auth profile,
 * which only the server's admin client can read for other people.
 */
async function topTaglines(names: string[]) {
  const found = new Map<string, string>();
  const admin = createAdminClient();
  if (!admin || names.length === 0) return found;
  try {
    const { data } = await admin.from("learners").select("user_id, display_name").in("display_name", names);
    const rows = (data ?? []) as { user_id: string; display_name: string }[];
    await Promise.all(
      rows.map(async (row) => {
        const { data: result } = await admin.auth.admin.getUserById(row.user_id);
        const tagline = cleanTagline(result.user?.user_metadata?.hub_tagline);
        if (tagline) found.set(row.display_name, tagline);
      }),
    );
  } catch (error) {
    // The board still shows without taglines.
    console.error("leaderboard: could not read taglines", error);
  }
  return found;
}
