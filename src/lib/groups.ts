/**
 * ITCamp groups. Members pick theirs when they register, and teammates in the same group
 * get different questions. The database accepts 1 to 30; change GROUP_COUNT to match the
 * number of groups this cohort actually has.
 */
export const GROUP_COUNT = 10;

export const GROUP_NUMBERS = Array.from({ length: GROUP_COUNT }, (_, i) => i + 1);

export function isGroupNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= GROUP_COUNT;
}
