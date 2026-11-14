import { questionsIn } from "@/lib/quiz-meta";
import type { CourseModule } from "@/lib/topics";

/** Best score per quiz slug, out of questionsIn(slug). A quiz missing here has not been finished yet. */
export type BestScores = Partial<Record<string, number>>;

export type Progress = { isAdmin: boolean; best: BestScores };

/** 1 star for finishing, 2 for one wrong answer, 3 for a perfect score. */
export function starsFor(best: number | undefined, outOf: number) {
  if (best === undefined) return 0;
  if (best >= outOf) return 3;
  if (best >= outOf - 1) return 2;
  return 1;
}

/** Best score per quiz from a list of attempts. */
// Older attempts were out of 10, so every score is rescaled to the quiz's current length.
export function bestScores(attempts: { quiz_slug: string; score: number; total?: number }[]): BestScores {
  const best: BestScores = {};
  for (const { quiz_slug, score, total } of attempts) {
    const outOf = questionsIn(quiz_slug);
    const scaled = Math.round((score / (total || outOf)) * outOf);
    best[quiz_slug] = Math.max(best[quiz_slug] ?? 0, scaled);
  }
  return best;
}

/** Whether every topic in a lesson has a finished attempt. */
function cleared(module: CourseModule | undefined, best: BestScores) {
  return !!module && module.topics.every((t) => best[t.slug] !== undefined);
}

/**
 * Applies the member's progress to the locks in topics.ts. A lesson marked opensAfterPrevious
 * opens once every topic in the lesson before it is finished; other locked lessons stay locked,
 * since their content does not exist yet. Inside an open lesson, a topic with a lock opens once
 * the topic before it is finished. Admins see everything unlocked.
 */
export function withProgress(modules: CourseModule[], { isAdmin, best }: Progress): CourseModule[] {
  return modules.map((module, mi) => {
    const moduleOpen = isAdmin || !module.lockedReason || (module.opensAfterPrevious && cleared(modules[mi - 1], best));
    return {
      ...module,
      lockedReason: moduleOpen ? null : module.lockedReason,
      topics: module.topics.map((topic, i) => {
        const prev = module.topics[i - 1];
        const open = isAdmin || !topic.lockedReason || (moduleOpen && prev && best[prev.slug] !== undefined);
        return { ...topic, lockedReason: open ? null : topic.lockedReason };
      }),
    };
  });
}

/** Guests have no saved progress, so every lesson whose challenges exist is open for them. */
export function openForGuests(modules: CourseModule[]): CourseModule[] {
  return modules.map((module) =>
    module.lockedReason && !module.opensAfterPrevious
      ? module
      : { ...module, lockedReason: null, topics: module.topics.map((topic) => ({ ...topic, lockedReason: null })) },
  );
}
