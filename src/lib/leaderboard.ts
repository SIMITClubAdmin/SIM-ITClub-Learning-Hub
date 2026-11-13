/** Shared leaderboard rules: ranking, and the tagline the top 3 can show under their name. */

export const TAGLINE_MAX = 60;

/** A tagline as it may be shown: one line of plain text, at most 60 characters. */
export function cleanTagline(raw: unknown) {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, TAGLINE_MAX);
}

export type BoardRow = { display_name: string; points: number };

/** Highest score first; equal scores keep the database's order, as the leaderboard page shows them. */
export function sortBoard<T extends { points: number }>(rows: T[]) {
  return [...rows].sort((a, b) => b.points - a.points);
}

/**
 * Where a member stands. rank is their place on the board (null when they are not on it), and
 * wouldBe is the place their score would earn among the listed members (for admins and guests).
 */
export function boardPosition(rows: BoardRow[], name: string | undefined, points: number) {
  const sorted = sortBoard(rows);
  const index = name ? sorted.findIndex((r) => r.display_name === name) : -1;
  return {
    rank: index >= 0 ? index + 1 : null,
    total: sorted.length,
    wouldBe: sorted.filter((r) => r.points > points).length + 1,
  };
}

export const MEDALS = [
  { emoji: "🥇", label: "Gold", colour: "#ffd166" },
  { emoji: "🥈", label: "Silver", colour: "#d4d8e3" },
  { emoji: "🥉", label: "Bronze", colour: "#ffb38a" },
] as const;
