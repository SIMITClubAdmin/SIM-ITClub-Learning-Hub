/**
 * ITCamp groups. Teammates in the same group get different questions. Groups 1-7 are this
 * cohort's; group 8 is for testing (test subcomm accounts pick it), and is kept off the
 * leaderboard. The database accepts 1 to 30; change GROUP_COUNT if the cohort changes.
 */
export const GROUP_COUNT = 8;

/** The testing group: its accounts are never ranked. */
export const TEST_GROUP = 8;

export const GROUP_NUMBERS = Array.from({ length: GROUP_COUNT }, (_, i) => i + 1);

export function isGroupNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= GROUP_COUNT;
}

export function isTestGroup(group: number | null | undefined) {
  return group === TEST_GROUP;
}

/** "Group 3", or "Group 8 (testing)". */
export function groupLabel(group: number) {
  return isTestGroup(group) ? `Group ${group} (testing)` : `Group ${group}`;
}
