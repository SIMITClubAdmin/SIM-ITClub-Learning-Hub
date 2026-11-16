"use client";

import { useSyncExternalStore } from "react";
import { cleanTitleIds, type TitleId } from "@/lib/skull-trials";

/**
 * Skull titles unlocked in this browser, kept per account ("guest" when not logged in) so a
 * shared computer doesn't hand one student's titles to the next. Logged-in members also get
 * them saved on their profile (src/app/practice/skull/actions.ts).
 */

const keyFor = (owner: string | null) => `itcamp-skull-titles:${owner ?? "guest"}`;
const listeners = new Set<() => void>();
const NONE: TitleId[] = [];
const cache = new Map<string, { raw: string | null; ids: TitleId[] }>();

export function readLocalTitles(owner: string | null): TitleId[] {
  const key = keyFor(owner);
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return NONE;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.ids;
  let ids: TitleId[] = NONE;
  try {
    ids = cleanTitleIds(JSON.parse(raw ?? "[]"));
  } catch {
    ids = NONE;
  }
  cache.set(key, { raw, ids });
  return ids;
}

export function addLocalTitle(owner: string | null, id: TitleId) {
  const next = cleanTitleIds([...readLocalTitles(owner), id]);
  try {
    localStorage.setItem(keyFor(owner), JSON.stringify(next));
  } catch {
    // Storage blocked: the profile copy (when logged in) still keeps it.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("itcamp-skull-titles:")) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The titles unlocked in this browser for this account. Empty during server rendering. */
export function useLocalTitles(owner: string | null) {
  return useSyncExternalStore(
    subscribe,
    () => readLocalTitles(owner),
    () => NONE,
  );
}
