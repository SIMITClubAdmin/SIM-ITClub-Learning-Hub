/**
 * Quiz facts that are safe to use in the browser: no questions, no answers.
 * The question bank (src/lib/quizzes.ts) is only ever imported by server code.
 */

/** Questions in an attempt unless a quiz sets its own count (QuizInfo.questions). */
export const QUESTIONS_PER_QUIZ = 5;

/** Attempts per quiz for a registered member: 1 + 1 extra. The best one counts. */
export const MAX_ATTEMPTS = 2;

export type QuizInfo = {
  title: string;
  /** The lesson (planet) the quiz belongs to. */
  lesson: number;
  /** The workshop activity the quiz follows, for lessons built around activities. */
  activity?: number;
  /** Questions in every attempt, and so the most a quiz can score. Defaults to QUESTIONS_PER_QUIZ. */
  questions?: number;
  /** Shown on the start card, under the attempt rules. */
  note?: string;
};

const TYPED_NOTE =
  "6 questions: multiple choice, plus commands you type. Extra spaces and ' or \" quotes are fine, but the command, its flags and names must be exact.";

/** Quizzes by topic slug, matching Topic.slug in topics.ts, in the order they are listed. */
export const QUIZ_INFO: Record<string, QuizInfo> = {
  html: { title: "HTML", lesson: 1 },
  css: { title: "CSS", lesson: 1 },
  javascript: { title: "JavaScript", lesson: 1 },
  // Lesson 2: one challenge per workshop activity. Every attempt asks all 6 questions.
  "git-basics": { title: "Git basics", lesson: 2, activity: 1, questions: 6, note: TYPED_NOTE },
  branches: { title: "Branching", lesson: 2, activity: 2, questions: 6, note: TYPED_NOTE },
  github: { title: "Merging & PRs", lesson: 2, activity: 3, questions: 6, note: TYPED_NOTE },
};

export function hasQuiz(slug: string) {
  return Object.hasOwn(QUIZ_INFO, slug);
}

/** Questions in each attempt of this quiz: the most it can score. */
export function questionsIn(slug: string) {
  return (hasQuiz(slug) && QUIZ_INFO[slug].questions) || QUESTIONS_PER_QUIZ;
}

/** The quiz's name in lists: "HTML", or "Activity 1: Git basics". */
export function quizLabel(slug: string) {
  const info = hasQuiz(slug) ? QUIZ_INFO[slug] : null;
  if (!info) return slug;
  return info.activity ? `Activity ${info.activity}: ${info.title}` : info.title;
}
