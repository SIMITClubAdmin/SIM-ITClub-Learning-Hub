"use client";

import { useCallback, useSyncExternalStore } from "react";
import { CHANGE_EVENT, DEFAULT_APPEARANCE, IDS, KEYS, type Appearance } from "./appearance-config";


/** Choices made this visit, so settings still work when storage is blocked. */
const memory: Partial<Record<keyof Appearance, string>> = {};

function readOne<K extends keyof Appearance>(key: K): Appearance[K] {
  let value: string | null | undefined = memory[key];
  if (value === undefined) {
    try {
      value = localStorage.getItem(KEYS[key]);
    } catch {
      value = null;
    }
  }
  return (value && IDS[key].includes(value) ? value : DEFAULT_APPEARANCE[key]) as Appearance[K];
}

/** True when this browser has saved any appearance choice. */
export function hasSavedAppearance() {
  try {
    return (Object.keys(KEYS) as (keyof Appearance)[]).some((k) => memory[k] !== undefined || localStorage.getItem(KEYS[k]) !== null);
  } catch {
    return false;
  }
}

export function saveAppearance(next: Partial<Appearance>) {
  for (const key of Object.keys(next) as (keyof Appearance)[]) {
    const value = next[key];
    if (!value) continue;
    memory[key] = value;
    try {
      localStorage.setItem(KEYS[key], value);
    } catch {
      // Private windows can block storage; the choice still lasts for this visit.
    }
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * The current appearance. The server renders defaults; the inline script in the root layout
 * applies the saved choice before first paint, and this store agrees right after hydration.
 */
export function useAppearance() {
  const font = useSyncExternalStore(subscribe, () => readOne("font"), () => DEFAULT_APPEARANCE.font);
  const palette = useSyncExternalStore(subscribe, () => readOne("palette"), () => DEFAULT_APPEARANCE.palette);
  const world = useSyncExternalStore(subscribe, () => readOne("world"), () => DEFAULT_APPEARANCE.world);
  const set = useCallback((next: Partial<Appearance>) => saveAppearance(next), []);
  return { font, palette, world, set };
}

