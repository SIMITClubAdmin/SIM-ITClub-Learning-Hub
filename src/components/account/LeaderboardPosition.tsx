import Link from "next/link";
import { MEDALS, type boardPosition } from "@/lib/leaderboard";
import type { AccountType } from "@/lib/supabase/learner";

/**
 * "Leaderboard position: #3 of 48", with a medal in the top 3, or where an account kept off the
 * leaderboard (EXCO, learner or testing group) would stand.
 */
export function LeaderboardPosition({
  position,
  onLeaderboard,
  accountType,
  testing = false,
}: {
  position: ReturnType<typeof boardPosition> | null;
  onLeaderboard: boolean;
  accountType: AccountType;
  /** In the testing group (group 8). */
  testing?: boolean;
}) {
  if (!position) return <p className="text-sm text-dim">Your leaderboard position can&apos;t be loaded right now.</p>;
  if (!onLeaderboard) {
    const who = testing ? "Testing group accounts are" : accountType === "exco" ? "EXCO accounts are" : "Learner accounts are";
    return (
      <p className="border-l-2 border-(--border-accent) pl-3 text-sm text-dim">
        {who} kept off the leaderboard. With your score you would be{" "}
        <span className="font-mono text-ink">
          #{position.wouldBe} of {position.total + 1}
        </span>
        .
      </p>
    );
  }
  if (position.rank === null) {
    return <p className="text-sm text-dim">You aren&apos;t on the leaderboard yet: finish a challenge to get a place.</p>;
  }
  const medal = position.rank <= 3 ? MEDALS[position.rank - 1] : null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-dim">Leaderboard position:</span>
      <Link href="/leaderboard" className="font-mono text-lg text-(--accent-text) underline underline-offset-4">
        #{position.rank}
      </Link>
      <span className="text-dim">of {position.total}</span>
      {medal && (
        <span className="border px-2 py-0.5 font-mono text-xs tracking-wider uppercase" style={{ borderColor: medal.colour, color: medal.colour }}>
          <span aria-hidden="true">{medal.emoji}</span> {medal.label}
        </span>
      )}
    </p>
  );
}
