import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { formatDateTime } from "@/lib/format";
import { QUIZ_TITLES } from "@/lib/quiz-meta";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Results · ITCamp Learning Hub" };
export const instant = false;

type ResultRow = {
  display_name: string;
  group_number: number | null;
  group_seat: number | null;
  quiz_slug: string;
  best_score: number | null;
  total: number;
  attempts_finished: number;
  last_answered_at: string | null;
};

type Member = { name: string; group: number | null; seat: number | null; quizzes: Record<string, ResultRow>; points: number };

/** Admins only: every member's best score per quiz, by group, to see strengths and gaps. */
export default async function ResultsPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/results");

  const { data, error } = await supabase.rpc("get_results");
  if (error) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <PageVeil />
        <h1 className="text-4xl font-semibold">Results</h1>
        <p className="mt-3 text-dim">This page is for admins only.</p>
        <Link href="/account" className="cta mt-6">
          Back to your account
        </Link>
      </main>
    );
  }

  const members = new Map<string, Member>();
  for (const row of (data ?? []) as ResultRow[]) {
    const key = `${row.group_number}:${row.group_seat}:${row.display_name}`;
    const member = members.get(key) ?? { name: row.display_name, group: row.group_number, seat: row.group_seat, quizzes: {}, points: 0 };
    member.quizzes[row.quiz_slug] = row;
    member.points += row.best_score ?? 0;
    members.set(key, member);
  }
  const quizzes = Object.entries(QUIZ_TITLES);
  const rows = [...members.values()];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-8">
      <PageVeil />
      <h1 className="text-4xl font-semibold">Member results</h1>
      <p className="mt-2 text-dim">
        Correct answers in each member&apos;s best attempt per quiz (attempts used in brackets). Members who haven&apos;t started any quiz don&apos;t
        appear yet.
      </p>
      <div className="mt-6 overflow-x-auto border border-violet bg-bg/90">
        <table className="w-full text-left text-sm">
          <thead className="font-mono text-xs tracking-wider text-dim uppercase">
            <tr className="border-b border-violet">
              <th className="p-3">Group</th>
              <th className="p-3">Member</th>
              {quizzes.map(([slug, title]) => (
                <th key={slug} className="p-3">
                  {title}
                </th>
              ))}
              <th className="p-3">Correct answers</th>
              <th className="p-3">Last finished</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const last = Object.values(m.quizzes)
                .map((r) => r.last_answered_at)
                .filter((d): d is string => !!d)
                .sort()
                .at(-1);
              return (
                <tr key={`${m.group}:${m.seat}:${m.name}`} className="border-b border-grid">
                  <td className="p-3 font-mono">{m.group ? `${m.group}.${m.seat}` : "-"}</td>
                  <td className="p-3">{m.name}</td>
                  {quizzes.map(([slug]) => {
                    const r = m.quizzes[slug];
                    return (
                      <td key={slug} className="p-3 font-mono">
                        {!r ? "-" : r.best_score === null ? `started (${r.attempts_finished})` : `${r.best_score}/${r.total} (${r.attempts_finished})`}
                      </td>
                    );
                  })}
                  <td className="p-3 font-mono text-accent">{m.points}</td>
                  <td className="p-3 font-mono text-xs text-dim">{last ? formatDateTime(last) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
