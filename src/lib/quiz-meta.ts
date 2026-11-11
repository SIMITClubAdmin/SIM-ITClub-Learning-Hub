/**
 * Quiz facts that are safe to use in the browser: no questions, no answers.
 * The question bank (src/lib/quizzes.ts) is only ever imported by server code.
 */

/** Questions in every attempt. Scores are out of this. */
export const QUESTIONS_PER_QUIZ = 5;

/** Attempts per quiz for a registered member: 1 + 1 extra. The best one counts. */
export const MAX_ATTEMPTS = 2;

/** Quiz titles by topic slug, matching Topic.slug in topics.ts. */
export const QUIZ_TITLES: Record<string, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
};

export function hasQuiz(slug: string) {
  return Object.hasOwn(QUIZ_TITLES, slug);
}
