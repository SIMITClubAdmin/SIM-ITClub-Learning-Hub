/**
 * The EXCO progress dashboard's numbers, worked out from the club database's
 * learning_hub.get_member_progress() rows. Pure functions, safe in the browser.
 */
import { ACTIVITIES, type ActivityId } from "./activities";
import { isTestGroup } from "./groups";
import { QUIZ_INFO, questionsIn, quizLabel } from "./quiz-meta";

/** One row of get_member_progress(), as the database returns it. */
export type ProgressRow = {
  member_id: string;
  display_name: string;
  group_number: number | null;
  group_seat: number | null;
  in_my_groups: boolean;
  opened_hub: boolean;
  quizzes: Record<string, { best: number | null; total: number | null; attempts: number; finished_at: string[] }> | null;
  activities: Record<string, { step: number; done_at: string }[]> | null;
  last_active_at: string | null;
};

/** One row of get_mentor_groups(). */
export type MentorGroup = {
  group_number: number;
  group_name: string;
  mentors: string[];
  mine: boolean;
  i_am_lead: boolean;
};

export type MemberStatus = "finished" | "in-progress" | "not-started";

export const STATUS_LABEL: Record<MemberStatus, string> = {
  finished: "Finished",
  "in-progress": "In progress",
  "not-started": "Not started",
};

export type DashboardMember = {
  id: string;
  name: string;
  group: number | null;
  seat: number | null;
  /** In a group the viewer mentors. */
  mine: boolean;
  openedHub: boolean;
  /** Correct answers in each challenge's best attempt, added up. */
  correct: number;
  /** Challenges with at least one finished attempt. */
  challengesDone: number;
  quizzes: { slug: string; label: string; best: number | null; outOf: number; attempts: number }[];
  activities: { id: ActivityId; done: number; steps: { step: number; doneAt: string }[] }[];
  stepsDone: number;
  /** 0 to 1. */
  challengePct: number;
  activityPct: number;
  overallPct: number;
  status: MemberStatus;
  lastActive: string | null;
  /** When each attempt finished, and when each activity step was first done. */
  challengeTimes: string[];
  stepTimes: string[];
};

export const CHALLENGE_SLUGS = Object.keys(QUIZ_INFO);
export const MAX_CORRECT = CHALLENGE_SLUGS.reduce((sum, slug) => sum + questionsIn(slug), 0);
export const TOTAL_STEPS = ACTIVITIES.reduce((sum, a) => sum + a.steps, 0);

export function toMember(row: ProgressRow): DashboardMember {
  const quizzes = CHALLENGE_SLUGS.map((slug) => {
    const q = row.quizzes?.[slug];
    return { slug, label: quizLabel(slug), best: q?.best ?? null, outOf: questionsIn(slug), attempts: q?.attempts ?? 0 };
  });
  const activities = ACTIVITIES.map((a) => {
    const steps = (row.activities?.[a.id] ?? [])
      .filter((s) => s.step >= 1 && s.step <= a.steps)
      .map((s) => ({ step: s.step, doneAt: s.done_at }))
      .sort((x, y) => x.step - y.step);
    return { id: a.id, done: steps.length, steps };
  });
  const correct = quizzes.reduce((sum, q) => sum + (q.best ?? 0), 0);
  const challengesDone = quizzes.filter((q) => q.best !== null).length;
  const stepsDone = activities.reduce((sum, a) => sum + a.done, 0);
  const challengePct = CHALLENGE_SLUGS.length ? challengesDone / CHALLENGE_SLUGS.length : 0;
  const activityPct = TOTAL_STEPS ? stepsDone / TOTAL_STEPS : 0;
  const startedAnything = quizzes.some((q) => q.attempts > 0) || stepsDone > 0 || Object.keys(row.quizzes ?? {}).length > 0;
  const status: MemberStatus =
    challengePct === 1 && activityPct === 1 ? "finished" : startedAnything ? "in-progress" : "not-started";
  return {
    id: row.member_id,
    name: row.display_name || "Unnamed",
    group: row.group_number,
    seat: row.group_seat,
    mine: row.in_my_groups,
    openedHub: row.opened_hub,
    correct,
    challengesDone,
    quizzes,
    activities,
    stepsDone,
    challengePct,
    activityPct,
    overallPct: (challengePct + activityPct) / 2,
    status,
    lastActive: row.last_active_at,
    challengeTimes: Object.values(row.quizzes ?? {}).flatMap((q) => q.finished_at ?? []),
    stepTimes: activities.flatMap((a) => a.steps.map((s) => s.doneAt)),
  };
}

/** Who a view shows: the viewer's groups, or every subcomm except the testing group. */
export function inView(member: DashboardMember, view: "mine" | "all") {
  return view === "mine" ? member.mine : !isTestGroup(member.group);
}

export function summarize(members: DashboardMember[]) {
  const count = members.length;
  const avg = (pick: (m: DashboardMember) => number) => (count ? members.reduce((s, m) => s + pick(m), 0) / count : 0);
  return {
    count,
    opened: members.filter((m) => m.openedHub).length,
    finished: members.filter((m) => m.status === "finished").length,
    challengePct: avg((m) => m.challengePct),
    activityPct: avg((m) => m.activityPct),
    avgCorrect: avg((m) => m.correct),
    byStatus: {
      finished: members.filter((m) => m.status === "finished"),
      "in-progress": members.filter((m) => m.status === "in-progress"),
      "not-started": members.filter((m) => m.status === "not-started"),
    } satisfies Record<MemberStatus, DashboardMember[]>,
  };
}

/** Members by group, in group order; anyone without a group last. */
export function byGroup(members: DashboardMember[]) {
  const groups = new Map<number | null, DashboardMember[]>();
  for (const m of members) groups.set(m.group, [...(groups.get(m.group) ?? []), m]);
  return [...groups.entries()]
    .sort(([a], [b]) => (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER))
    .map(([group, list]) => ({ group, members: list }));
}

const SG_OFFSET_MS = 8 * 60 * 60 * 1000;

/** The Singapore calendar day of a moment, as YYYY-MM-DD. */
export function sgDay(value: string | number) {
  return new Date(new Date(value).getTime() + SG_OFFSET_MS).toISOString().slice(0, 10);
}

/** Challenges finished and activity steps done on each of the last `days` Singapore days. */
export function dailyCounts(members: DashboardMember[], now: string, days = 30) {
  const end = new Date(now).getTime();
  const list = Array.from({ length: days }, (_, i) => ({
    day: sgDay(end - (days - 1 - i) * 24 * 60 * 60 * 1000),
    challenges: 0,
    steps: 0,
  }));
  const index = new Map(list.map((d, i) => [d.day, i]));
  for (const m of members) {
    for (const t of m.challengeTimes) {
      const i = index.get(sgDay(t));
      if (i !== undefined) list[i].challenges++;
    }
    for (const t of m.stepTimes) {
      const i = index.get(sgDay(t));
      if (i !== undefined) list[i].steps++;
    }
  }
  return list;
}

/** For each step of an activity, how many of these members have done it. */
export function stepFunnel(members: DashboardMember[], activity: ActivityId) {
  const info = ACTIVITIES.find((a) => a.id === activity)!;
  return Array.from({ length: info.steps }, (_, i) => ({
    step: i + 1,
    count: members.filter((m) => m.activities.find((a) => a.id === activity)?.steps.some((s) => s.step === i + 1)).length,
  }));
}

/** The step after which the most members stop: the biggest drop between neighbours. */
export function biggestDrop(funnel: { step: number; count: number }[]) {
  let best: { step: number; drop: number } | null = null;
  for (let i = 1; i < funnel.length; i++) {
    const drop = funnel[i - 1].count - funnel[i].count;
    if (drop > 0 && (!best || drop > best.drop)) best = { step: funnel[i].step, drop };
  }
  return best;
}

export const pct = (n: number) => `${Math.round(n * 100)}%`;
