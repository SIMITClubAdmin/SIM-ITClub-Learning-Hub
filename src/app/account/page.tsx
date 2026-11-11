import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { GroupPicker } from "@/components/account/GroupPicker";
import { AccountForm } from "@/components/auth/AccountForm";
import { bestScores } from "@/lib/progress";
import { MAX_ATTEMPTS, QUESTIONS_PER_QUIZ, QUIZ_TITLES } from "@/lib/quiz-meta";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account · ITCamp Learning Hub" };

// Shows the signed-in member's own details, so this page renders per request.
export const instant = false;

export default async function AccountPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: attempts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, created_at, is_admin, group_number, group_seat")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("quiz_attempts").select("quiz_slug, score, total, finished_at").eq("user_id", user.id),
  ]);
  const isAdmin = !!profile?.is_admin;
  const finished = (attempts ?? []).filter((a) => a.finished_at);
  const best = bestScores(finished);
  const points = Object.values(best).reduce<number>((sum, n) => sum + (n ?? 0), 0);

  const joined = profile ? new Date(profile.created_at).toLocaleDateString("en-SG", { dateStyle: "long" }) : "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-semibold">Your account</h1>
        {isAdmin && (
          <span className="border border-accent px-2 py-0.5 font-mono text-xs tracking-wider text-accent uppercase">
            Admin
          </span>
        )}
      </div>
      {isAdmin && (
        <p className="-mt-3 text-sm text-dim">
          Everything in Practice is unlocked for you, and you are kept off the leaderboard.{" "}
          <Link href="/admin/results" className="text-ink underline underline-offset-4">
            See every member&apos;s results
          </Link>
          .
        </p>
      )}
      <dl className="flex flex-col gap-4 border border-violet bg-bg/85 p-5">
        <div>
          <dt className="text-sm text-dim">Email</dt>
          <dd className="break-words">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-dim">ITCamp group</dt>
          <dd>{profile?.group_number ? `Group ${profile.group_number} (member ${profile.group_seat})` : "Not set yet"}</dd>
        </div>
        <div>
          <dt className="text-sm text-dim">Joined</dt>
          <dd>{joined}</dd>
        </div>
        <div>
          <dt className="text-sm text-dim">Password</dt>
          <dd>
            <Link href="/account/password" className="text-ink underline underline-offset-4">
              Change password
            </Link>
          </dd>
        </div>
      </dl>
      {!profile?.group_number && <GroupPicker />}

      <section aria-labelledby="points-heading" className="flex flex-col gap-3 border border-violet bg-bg/85 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="points-heading" className="text-xl font-semibold">
            Your points
          </h2>
          <p className="font-mono text-lg text-accent">{points}</p>
        </div>
        <p className="text-sm text-dim">
          One point per correct answer in your best attempt of each quiz ({MAX_ATTEMPTS} attempts each).
        </p>
        <ul className="flex flex-col gap-1.5">
          {Object.entries(QUIZ_TITLES).map(([slug, title]) => {
            const used = finished.filter((a) => a.quiz_slug === slug).length;
            return (
              <li key={slug} className="flex justify-between gap-3">
                <Link href={`/practice/${slug}`} className="underline underline-offset-4">
                  {title}
                </Link>
                <span className="font-mono text-sm text-dim">
                  {best[slug] === undefined ? "not attempted" : `${best[slug]} / ${QUESTIONS_PER_QUIZ}`} · {used}/{MAX_ATTEMPTS} used
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <AccountForm userId={user.id} initialName={profile?.display_name ?? ""} onLeaderboard={!isAdmin} />
    </main>
  );
}
