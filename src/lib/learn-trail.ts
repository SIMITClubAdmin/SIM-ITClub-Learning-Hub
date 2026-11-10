"use client";

// Where the Learn rocket should fly, kept for this browser tab only, so every fresh visit
// starts at HTML. Storage can be blocked (private windows), so every access is guarded.
const LAST_TOPIC = "learn-last-topic";
const ROCKET_AT = "learn-rocket-at";

function read(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Without storage the rocket simply stays at the start.
  }
}

/** Called from a lesson page: the member is studying this topic. */
export function rememberLearnTopic(slug: string) {
  write(LAST_TOPIC, slug);
}

/**
 * The rocket's stops for the Learn wheel: where it was last shown, and the topic after the
 * one most recently studied. With nothing studied yet, both are the first topic (HTML).
 * Calls within a second return the same answer, since React runs effects twice in development.
 */
export function nextRocketStop(topicSlugs: string[]) {
  const lastSlug = read(LAST_TOPIC) ?? "";
  const last = topicSlugs.indexOf(lastSlug);
  const to = last === -1 ? 0 : Math.min(last + 1, topicSlugs.length - 1);

  let saved: { from: number; to: number; at: number } | null = null;
  try {
    saved = JSON.parse(read(ROCKET_AT) ?? "null");
  } catch {
    saved = null;
  }
  if (saved && saved.to === to && Date.now() - saved.at < 1000) return { from: saved.from, to };

  const valid = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < topicSlugs.length;
  const from = saved && valid(saved.to) ? saved.to : to;
  write(ROCKET_AT, JSON.stringify({ from, to, at: Date.now() }));
  return { from, to };
}
