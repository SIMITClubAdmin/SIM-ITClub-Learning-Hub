/**
 * Which questions each attempt gets.
 *
 * Members: decided by (quiz, group, seat, attempt), so it never changes on refresh, and
 * every draw inside a group is a different set of questions. Draws are numbered
 *   draw = (seat - 1) * MAX_ATTEMPTS + (attempt - 1)
 * so seat 1 gets draws 0 and 1, seat 2 gets draws 2 and 3, and so on. Each draw takes the
 * questions the group has seen least so far, prefers different topics, and is re-drawn if
 * it matches an earlier set exactly.
 *
 * Guests: a fresh random set each time.
 */
import { MAX_ATTEMPTS } from "@/lib/quiz-meta";

type Drawable = { id: string; topic: string };

/** FNV-1a: a small, stable string hash. */
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: a seeded random number generator, so the same seed gives the same numbers. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks `count` questions one at a time. The least-used question always wins; among
 * equally used ones, a topic not yet in this set wins; remaining ties go to `random`.
 */
function pick(bank: readonly Drawable[], count: number, used: Map<string, number>, random: () => number, noise = 0) {
  // noise > 0 lets a retry move away from the cheapest set when that set is already taken.
  const jitter = new Map(bank.map((q) => [q.id, random() * noise]));
  const left = shuffle(bank, random);
  const chosen: Drawable[] = [];
  const topics = new Set<string>();
  while (chosen.length < count && left.length > 0) {
    let best = 0;
    let bestCost = Infinity;
    left.forEach((q, i) => {
      // Usage counts are whole numbers, so the topic penalty only breaks ties.
      const cost = (used.get(q.id) ?? 0) + (topics.has(q.topic) ? 0.5 : 0) + (jitter.get(q.id) ?? 0);
      if (cost < bestCost) {
        best = i;
        bestCost = cost;
      }
    });
    const [q] = left.splice(best, 1);
    chosen.push(q);
    topics.add(q.topic);
  }
  return chosen;
}

const setKey = (ids: string[]) => [...ids].sort().join("|");

/** Largest group size the "never repeat a set" promise covers. */
const SEAT_LOOKAHEAD = 30;

type Sequence = { used: Map<string, number>; seen: Set<string> };

/**
 * One draw in a sequence. `avoid` (the member's own earlier attempt) counts as heavily
 * used for this draw only, and its exact set is never repeated.
 */
function nextDraw(bank: readonly Drawable[], size: number, seed: string, seq: Sequence, avoid: string[] = []) {
  const used = new Map(seq.used);
  for (const id of avoid) used.set(id, (used.get(id) ?? 0) + 2);
  let ids: string[] = [];
  for (let salt = 0; ; salt++) {
    const random = seeded(hash(`${seed}:${salt}`));
    ids = shuffle(
      pick(bank, size, used, random, salt * 0.25).map((q) => q.id),
      random,
    );
    const key = setKey(ids);
    // A repeat is allowed only when the bank has run out of new sets.
    if ((!seq.seen.has(key) && key !== setKey(avoid)) || salt >= 200) break;
  }
  seq.seen.add(setKey(ids));
  for (const id of ids) seq.used.set(id, (seq.used.get(id) ?? 0) + 1);
  return ids;
}

/**
 * The question ids for one member's attempt, in the order they are shown.
 *
 * First attempts form one sequence per group (seat 1, seat 2, ...), so teammates sitting
 * together spread over the whole bank first. Second attempts form another sequence, and
 * each one avoids that member's own first attempt. Within each sequence every set differs.
 */
export function drawForMember(
  bank: readonly Drawable[],
  count: number,
  { slug, group, seat, attempt }: { slug: string; group: number; seat: number; attempt: number },
): string[] {
  const size = Math.min(count, bank.length);
  // A quiz that asks its whole bank (the Git activities) has only one set, so there is
  // nothing to spread: each member and attempt just gets its own fixed order.
  if (size === bank.length) {
    return shuffle(
      bank.map((q) => q.id),
      seeded(hash(`${slug}:${group}:${seat}:a${attempt}`)),
    );
  }
  const firsts: Sequence = { used: new Map(), seen: new Set() };
  const firstSets: string[][] = [];
  if (attempt <= 1 || MAX_ATTEMPTS < 2) {
    for (let s = 1; s <= seat; s++) firstSets.push(nextDraw(bank, size, `${slug}:${group}:a1:${s}`, firsts));
    return firstSets[seat - 1];
  }

  // A seat's first attempt doesn't depend on later seats, so work out the first attempts of
  // every seat up to SEAT_LOOKAHEAD: no second attempt may repeat any of those sets.
  for (let s = 1; s <= Math.max(seat, SEAT_LOOKAHEAD); s++) {
    firstSets.push(nextDraw(bank, size, `${slug}:${group}:a1:${s}`, firsts));
  }
  const seconds: Sequence = { used: new Map(), seen: new Set(firstSets.map(setKey)) };
  let ids: string[] = [];
  for (let s = 1; s <= seat; s++) ids = nextDraw(bank, size, `${slug}:${group}:a2:${s}`, seconds, firstSets[s - 1]);
  return ids;
}

/** A random set for a guest. */
export function drawForGuest(bank: readonly Drawable[], count: number): string[] {
  return pick(bank, Math.min(count, bank.length), new Map(), Math.random).map((q) => q.id);
}
