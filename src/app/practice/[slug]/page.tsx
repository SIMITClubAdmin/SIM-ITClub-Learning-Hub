import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Quiz } from "@/components/practice/Quiz";
import { QUIZZES } from "@/lib/quizzes";

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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-8">
      <Link href="/practice" className="font-mono text-xs tracking-wider text-dim uppercase hover:text-accent">
        ← All lessons
      </Link>
      <div className="mt-4">
        <Quiz quiz={quiz} />
      </div>
    </main>
  );
}
