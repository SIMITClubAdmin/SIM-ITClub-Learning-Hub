import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GitLessonPage } from "@/components/git-studio/GitLearningPage";
import { findGitLesson, GIT_LESSONS } from "@/components/git-studio/lessons/registry";

// Every lesson is built ahead of time, so reading the URL here does not slow navigation.
export const instant = false;

export function generateStaticParams() {
  return GIT_LESSONS.map((lesson) => ({ lesson: lesson.slug }));
}

export async function generateMetadata(props: PageProps<"/learn/git/[lesson]">): Promise<Metadata> {
  const { lesson } = await props.params;
  const found = findGitLesson(lesson);
  return { title: found ? `${found.lesson.title} · Git & GitHub · ITCamp Learning Hub` : "Git & GitHub · ITCamp Learning Hub" };
}

export default async function GitLessonRoute(props: PageProps<"/learn/git/[lesson]">) {
  const { lesson } = await props.params;
  if (!findGitLesson(lesson)) notFound();
  return <GitLessonPage slug={lesson} />;
}
