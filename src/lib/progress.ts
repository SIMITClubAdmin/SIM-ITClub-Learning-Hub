import type { CourseModule } from "@/lib/topics";

/** Best score out of 10 per quiz slug. A quiz missing here has not been finished yet. */
export type BestScores = Partial<Record<string, number>>;

export type Progress = { isAdmin: boolean; best: BestScores };

/** 1 star for finishing, 2 for 7 or more, 3 for a perfect 10. */
export function starsFor(best: number | undefined) {
  if (best === undefined) return 0;
  if (best === 10) return 3;
  if (best >= 7) return 2;
  return 1;
}

/** Best score per quiz from a list of attempts. */
export function bestScores(attempts: { quiz_slug: string; score: number }[]): BestScores {
  const best: BestScores = {};
  for (const { quiz_slug, score } of attempts) best[quiz_slug] = Math.max(best[quiz_slug] ?? 0, score);
  return best;
}

/**
 * Applies the member's progress to the locks in topics.ts. Inside an open lesson, a topic
 * with a lock opens once the topic before it is finished. Admins see everything unlocked.
 * Locked lessons stay locked, since their content does not exist yet.
 */
export function withProgress(modules: CourseModule[], { isAdmin, best }: Progress): CourseModule[] {
  return modules.map((module) => ({
    ...module,
    lockedReason: isAdmin ? null : module.lockedReason,
    topics: module.topics.map((topic, i) => {
      const prev = module.topics[i - 1];
      const open = isAdmin || !topic.lockedReason || (!module.lockedReason && prev && best[prev.slug] !== undefined);
      return { ...topic, lockedReason: open ? null : topic.lockedReason };
    }),
  }));
}
