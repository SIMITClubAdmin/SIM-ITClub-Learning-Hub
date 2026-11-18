/**
 * Made-up progress for previewing the EXCO dashboard (/admin/progress?demo) in development,
 * before real members have any. Seeded, so every load shows the same people.
 */
import { ACTIVITIES } from "./activities";
import type { MentorGroup, ProgressRow } from "./progress-dashboard";
import { CHALLENGE_SLUGS } from "./progress-dashboard";
import { questionsIn } from "./quiz-meta";

const FIRST = ["Aiden", "Bella", "Chen", "Dina", "Ethan", "Farah", "Gwen", "Hari", "Iris", "Jun", "Kai", "Lina", "Mei", "Nadia", "Omar", "Priya"];
const LAST = ["Tan", "Lim", "Ng", "Koh", "Wong", "Lee", "Ong", "Goh"];

function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function demoProgress(now: string): { rows: ProgressRow[]; groups: MentorGroup[] } {
  const rand = seeded(42);
  const end = new Date(now).getTime();
  const at = (daysAgo: number) => new Date(end - daysAgo * 86_400_000 - rand() * 36_000_000).toISOString();
  const rows: ProgressRow[] = [];
  let n = 0;
  for (let group = 1; group <= 8; group++) {
    const size = group === 8 ? 2 : 5 + Math.floor(rand() * 3);
    for (let seat = 1; seat <= size; seat++) {
      const name = group === 8 ? `Test Subcomm ${seat}` : `${FIRST[n % FIRST.length]} ${LAST[(n * 3 + group) % LAST.length]}`;
      n++;
      const opened = rand() > 0.12;
      // How far along this person is, from 0 to 1.
      const drive = opened ? Math.min(1, rand() * 1.3) : 0;
      const quizzes: ProgressRow["quizzes"] = {};
      CHALLENGE_SLUGS.forEach((slug, i) => {
        if (i / CHALLENGE_SLUGS.length >= drive) return;
        const outOf = questionsIn(slug);
        const attempts = rand() > 0.6 ? 2 : 1;
        quizzes[slug] = {
          best: Math.max(1, Math.round(outOf * (0.5 + rand() * 0.5))),
          total: outOf,
          attempts,
          finished_at: Array.from({ length: attempts }, () => at(Math.floor(rand() * 28))).sort(),
        };
      });
      const activities: ProgressRow["activities"] = {};
      for (const a of ACTIVITIES) {
        const reached = Math.min(a.steps, Math.floor(a.steps * Math.min(1, drive * 1.2 - (a.steps === 4 ? 0.3 : 0)) + rand()));
        if (reached > 0) activities[a.id] = Array.from({ length: reached }, (_, i) => ({ step: i + 1, done_at: at(Math.floor(rand() * 26)) }));
      }
      const times = [...Object.values(quizzes).flatMap((q) => q.finished_at), ...Object.values(activities).flat().map((s) => s.done_at)].sort();
      rows.push({
        member_id: `demo-${group}-${seat}`,
        display_name: name,
        group_number: group,
        group_seat: opened ? seat : null,
        in_my_groups: group === 3,
        opened_hub: opened,
        quizzes,
        activities,
        last_active_at: times.at(-1) ?? null,
      });
    }
  }
  const groups: MentorGroup[] = Array.from({ length: 7 }, (_, i) => ({
    group_number: i + 1,
    group_name: "",
    mentors: i + 1 === 3 ? ["You (demo)", "Co-mentor"] : [`Mentor ${i + 1}`],
    mine: i + 1 === 3,
    i_am_lead: i + 1 === 3,
  }));
  return { rows, groups };
}
