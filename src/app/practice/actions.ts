"use server";

import { refresh } from "next/cache";
import { withProgress } from "@/lib/progress";
import { QUIZZES } from "@/lib/quizzes";
import { createClient } from "@/lib/supabase/server";
import { loadProgress } from "@/lib/supabase/progress";
import { MODULES } from "@/lib/topics";

export type SaveResult = { ok: true; score: number } | { ok: false; error: string };

/**
 * Grades a finished quiz on the server and saves the score for the logged-in member.
 * answers maps each question's text to the choice the member picked.
 */
export async function saveQuizResult(slug: string, answers: Record<string, string>): Promise<SaveResult> {
  const quiz = QUIZZES[slug];
  if (!quiz) return { ok: false, error: "That quiz does not exist." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Log in to save your score." };

  const progress = await loadProgress(supabase, user.id);
  const topic = withProgress(MODULES, progress)
    .flatMap((m) => m.topics)
    .find((t) => t.slug === slug);
  if (topic?.lockedReason) return { ok: false, error: topic.lockedReason };

  // Every question must be answered once; the first choice in quizzes.ts is the right one.
  if (quiz.questions.some((q) => !(q.question in answers))) {
    return { ok: false, error: "Answer every question before saving." };
  }
  const score = quiz.questions.filter((q) => answers[q.question] === q.choices[0]).length;

  const { error } = await supabase.from("quiz_attempts").insert({ quiz_slug: slug, score, total: quiz.questions.length });
  if (error) return { ok: false, error: "We could not save your score. Please try again." };

  refresh();
  return { ok: true, score };
}
