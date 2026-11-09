import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Quiz } from "@/components/practice/Quiz";
import { QUIZZES } from "@/lib/quizzes";

// All quizzes are built ahead of time, so reading the slug here does not slow navigation.
export const instant = false;

export function generateStaticParams() {
  return Object.keys(QUIZZES).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/practice/[slug]">): Promise<Metadata> {
  const quiz = QUIZZES[(await props.params).slug];
  return { title: quiz ? `${quiz.title} quiz · ITCamp Learning Hub` : "Practice · ITCamp Learning Hub" };
}

export default async function QuizPage(props: PageProps<"/practice/[slug]">) {
  const quiz = QUIZZES[(await props.params).slug];
  if (!quiz) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
      {/* Focus mode: a still backdrop covers the moving pixel clouds while the member answers. */}
      <div className="quiz-backdrop pointer-events-none fixed inset-0" style={{ zIndex: -1 }} aria-hidden="true" />
      <Link href="/practice" className="font-mono text-sm tracking-wider text-dim uppercase hover:text-accent">
        ← All lessons
      </Link>
      <div className="mt-4">
        <Quiz quiz={quiz} />
      </div>
    </main>
  );
}
