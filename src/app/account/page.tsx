import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { GroupPicker } from "@/components/account/GroupPicker";
import { LeaderboardPosition } from "@/components/account/LeaderboardPosition";
import { AppearanceSettings } from "@/components/appearance/AppearanceSettings";
import { AccountForm } from "@/components/auth/AccountForm";
import { ACTIVITIES } from "@/lib/activities";
import { groupLabel, isTestGroup } from "@/lib/groups";
import { boardPosition, cleanTagline, rankedRows, type BoardRow } from "@/lib/leaderboard";
import { bestScores } from "@/lib/progress";
import { cleanTitleIds, EQUIPPED_KEY, equippedTitle, TITLES_KEY } from "@/lib/skull-trials";
import { hasQuiz, MAX_ATTEMPTS, questionsIn, quizLabel } from "@/lib/quiz-meta";
import { ACCOUNT_TYPE_LABEL, loadLearner, needsGroup } from "@/lib/supabase/learner";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/topics";

export const metadata: Metadata = { title: "Account · ITCamp Learning Hub" };

// Shows the signed-in member's own details, so this page renders per request.
export const instant = false;

/** The challenges in each lesson, in course order: HTML, CSS and JavaScript, then Git & GitHub. */
const LESSON_QUIZZES = MODULES.map((m) => ({ number: m.number, title: m.title, slugs: m.topics.map((t) => t.slug).filter(hasQuiz) })).filter(
  (lesson) => lesson.slugs.length > 0,
);

export default async function AccountPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The learner row is made on their first visit, so load it before reading when they joined.
  const learner = await loadLearner(supabase);
  const [{ data: profile }, { data: attempts }, board, activitySteps] = await Promise.all([
    supabase.from("learners").select("created_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("quiz_attempts").select("quiz_slug:topic_slug, score, total, finished_at").eq("user_id", user.id),
    supabase.rpc("get_leaderboard"),
    supabase.from("activity_steps").select("activity, step").eq("user_id", user.id),
  ]);
  // Null until the club database has activity_steps: the section then stays hidden.
  const stepsDone = activitySteps.error ? null : (activitySteps.data ?? []);
  const accountType = learner?.account_type ?? "learner";
  const isExco = accountType === "exco";
  const finished = (attempts ?? []).filter((a) => a.finished_at);
  const best = bestScores(finished);
  const points = Object.values(best).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  // Only subcomms are ranked; learners, EXCO and the testing group are kept off the leaderboard.
  const testing = isTestGroup(learner?.group_number);
  const onLeaderboard = accountType === "subcomm" && !testing;
  const position = board.error ? null : boardPosition(rankedRows(board.data as BoardRow[] | null), learner?.display_name, points);

  const joined = profile ? new Date(profile.created_at).toLocaleDateString("en-SG", { dateStyle: "long" }) : "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <PageVeil />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-semibold">Your account</h1>
        {isExco && (
          <span className="border border-(--border-accent) bg-(--accent-soft) px-2 py-0.5 font-mono text-xs tracking-wider text-(--accent-text) uppercase">
            EXCO
          </span>
        )}
      </div>
      {isExco && (
        <p className="-mt-3 text-sm text-dim">
          Every challenge is unlocked for you, and you are kept off the leaderboard.{" "}
          <Link href="/admin/progress" className="text-ink underline underline-offset-4">
            Open the progress dashboard
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
          <dt className="text-sm text-dim">Account type</dt>
          <dd>{ACCOUNT_TYPE_LABEL[accountType]}</dd>
        </div>
        <div>
          <dt className="text-sm text-dim">ITCamp group</dt>
          <dd>
            {learner?.group_number
              ? `${groupLabel(learner.group_number)} (member ${learner.group_seat})`
              : accountType === "learner"
                ? "None (learner account)"
                : "Not set yet"}
          </dd>
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
      {needsGroup(learner) && <GroupPicker />}

      <section aria-labelledby="points-heading" className="flex flex-col gap-3 border border-violet bg-bg/85 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="points-heading" className="text-xl font-semibold">
            Correct answers
          </h2>
          <p className="font-mono text-lg text-(--accent-text)">{points}</p>
        </div>
        <p className="text-sm text-dim">
          Questions you got right, counting your best attempt of each challenge ({MAX_ATTEMPTS} attempts each).
        </p>
        <LeaderboardPosition position={position} onLeaderboard={onLeaderboard} accountType={accountType} testing={testing} />
        {LESSON_QUIZZES.map((lesson) => {
          const got = lesson.slugs.reduce((sum, slug) => sum + (best[slug] ?? 0), 0);
          const outOf = lesson.slugs.reduce((sum, slug) => sum + questionsIn(slug), 0);
          return (
            <div key={lesson.number} className="flex flex-col gap-1.5">
              <p className="flex justify-between gap-3 border-b border-grid pb-1 font-mono text-xs tracking-wider text-dim uppercase">
                <span>
                  Lesson {lesson.number} · {lesson.title}
                </span>
                <span className="shrink-0">
                  {got} / {outOf}
                </span>
              </p>
              <ul className="flex flex-col gap-1.5">
                {lesson.slugs.map((slug) => {
                  const used = finished.filter((a) => a.quiz_slug === slug).length;
                  return (
                    <li key={slug} className="flex justify-between gap-3">
                      <Link href={`/practice/${slug}`} className="underline underline-offset-4">
                        {quizLabel(slug)}
                      </Link>
                      <span className="shrink-0 font-mono text-sm text-dim">
                        {best[slug] === undefined ? "not attempted" : `${best[slug]} / ${questionsIn(slug)}`} · {used}/{MAX_ATTEMPTS} used
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      {stepsDone && (
        <section aria-labelledby="activities-heading" className="flex flex-col gap-3 border border-violet bg-bg/85 p-5">
          <h2 id="activities-heading" className="text-xl font-semibold">
            Git activities
          </h2>
          <p className="text-sm text-dim">Steps you&apos;ve finished in the Git Studio, saved as you go.</p>
          <ul className="flex flex-col gap-3">
            {ACTIVITIES.map((activity) => {
              const done = stepsDone.filter((s) => s.activity === activity.id).length;
              return (
                <li key={activity.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-3">
                    <Link href={activity.href} className="underline underline-offset-4">
                      {activity.title} · {activity.name}
                    </Link>
                    <span className="shrink-0 font-mono text-sm text-dim">
                      {done === activity.steps ? "done" : `${done} / ${activity.steps} ${activity.unit}`}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${activity.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={activity.steps}
                    aria-valuenow={done}
                    className="h-1.5 overflow-hidden rounded-full bg-grid"
                  >
                    <div className="h-full rounded-full bg-(--accent-primary)" style={{ width: `${(done / activity.steps) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <AccountForm
        userId={user.id}
        initialName={learner?.display_name ?? ""}
        initialTagline={cleanTagline(user.user_metadata?.hub_tagline)}
        // Learners, EXCO and the testing group are kept off the leaderboard.
        onLeaderboard={onLeaderboard}
        unlockedTitles={cleanTitleIds(user.user_metadata?.[TITLES_KEY])}
        initialTitle={equippedTitle(user.user_metadata?.[EQUIPPED_KEY], user.user_metadata?.[TITLES_KEY])}
      />

      <AppearanceSettings signedIn />
    </main>
  );
}
