import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Quiz } from "@/components/practice/Quiz";
import { withProgress } from "@/lib/progress";
import { QUIZZES } from "@/lib/quizzes";
import { createClient } from "@/lib/supabase/server";
import { loadProgress } from "@/lib/supabase/progress";
import { MODULES } from "@/lib/topics";

// Checks the member's progress, so this page renders per request.
export const instant = false;

export async function generateMetadata(props: PageProps<"/practice/[slug]">): Promise<Metadata> {
  const quiz = QUIZZES[(await props.params).slug];
  return { title: quiz ? `${quiz.title} quiz · ITCamp Learning Hub` : "Practice · ITCamp Learning Hub" };
}

export default async function QuizPage(props: PageProps<"/practice/[slug]">) {
  await connection();
  const { slug } = await props.params;
  const quiz = QUIZZES[slug];
  if (!quiz) notFound();

  // src/proxy.ts already sends logged-out visitors to the login page.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const progress = user ? await loadProgress(supabase, user.id) : { isAdmin: false, best: {} };
  const lockedReason = withProgress(MODULES, progress)
    .flatMap((m) => m.topics)
    .find((t) => t.slug === slug)?.lockedReason;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-3 sm:px-8">
      {/* A dark veil keeps the homepage background very faint behind the content. */}
      <div className="quiz-backdrop pointer-events-none fixed inset-0" style={{ zIndex: -1 }} aria-hidden="true" />
      <Link href="/practice" className="font-mono text-sm tracking-wider text-dim uppercase hover:text-accent">
        ← All lessons
      </Link>
      <div className="mt-3">
        {lockedReason ? (
          <section className="border border-violet bg-bg p-6 sm:p-8">
            <p className="font-mono text-sm tracking-wider text-accent uppercase">Locked</p>
            <h1 className="mt-2 text-4xl font-semibold">{quiz.title} quiz</h1>
            <p className="mt-3 text-lg text-dim">{lockedReason} first, then come back for this mission.</p>
            <Link href="/practice" className="cta mt-6">
              Back to Practice
            </Link>
          </section>
        ) : (
          <Quiz quiz={quiz} slug={slug} />
        )}
      </div>
    </main>
  );
}
