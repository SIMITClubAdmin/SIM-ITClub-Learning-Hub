"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  ACTIVE_KEY,
  CHANGE_EVENT,
  DEFAULT_APPEARANCE,
  GUEST,
  IDS,
  LEGACY_KEYS,
  STORAGE_PREFIX,
  type Appearance,
  type StoredAppearance,
} from "./appearance-config";

/**
 * Choices per owner (a user id, or "guest"), read from localStorage once and kept here.
 * It also keeps choices for this visit when storage is blocked.
 */
const memory = new Map<string, StoredAppearance | null>();
let owner: string | null = null;

const KEYS = Object.keys(DEFAULT_APPEARANCE) as (keyof Appearance)[];

/** Keeps only known ids (the old cat, dog, Pingu and Chiikawa worlds fall away) and a valid time. */
export function cleanAppearance(raw: unknown): StoredAppearance {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: StoredAppearance = {};
  for (const key of KEYS) {
    const value = r[key];
    if (typeof value === "string" && IDS[key].includes(value)) (out as Record<string, string>)[key] = value;
  }
  if (typeof r.at === "number" && Number.isFinite(r.at)) out.at = r.at;
  return out;
}

const hasChoice = (s: StoredAppearance | null | undefined) => !!s && KEYS.some((k) => s[k] !== undefined);

function getOwner() {
  if (owner === null) {
    try {
      owner = localStorage.getItem(ACTIVE_KEY) || GUEST;
    } catch {
      owner = GUEST;
    }
  }
  return owner;
}

function readStored(id: string): StoredAppearance | null {
  if (memory.has(id)) return memory.get(id) ?? null;
  let found: StoredAppearance | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (raw) found = cleanAppearance(JSON.parse(raw));
    // Before choices were kept per account, they lived under three hub-* keys.
    if (!hasChoice(found) && id === GUEST) {
      const legacy = cleanAppearance(Object.fromEntries(KEYS.map((k) => [k, localStorage.getItem(LEGACY_KEYS[k])])));
      if (hasChoice(legacy)) found = legacy;
    }
  } catch {
    // Storage blocked or a damaged value: nothing saved.
  }
  found = hasChoice(found) ? found : null;
  memory.set(id, found);
  return found;
}

function writeStored(id: string, value: StoredAppearance) {
  memory.set(id, value);
  try {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(value));
  } catch {
    // Private windows can block storage; the choice still lasts for this visit.
  }
}

/** The showing owner's choice. An account with nothing saved yet keeps this browser's guest look. */
export function currentAppearance(): StoredAppearance {
  const id = getOwner();
  return readStored(id) ?? (id !== GUEST ? readStored(GUEST) : null) ?? {};
}

function readOne<K extends keyof Appearance>(key: K): Appearance[K] {
  return (currentAppearance()[key] ?? DEFAULT_APPEARANCE[key]) as Appearance[K];
}

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

/** Saves a choice for whoever is signed in on this browser (or the guest). Returns the full saved copy. */
export function saveAppearance(next: Partial<Appearance>): Required<Appearance> & { at: number } {
  const full = { ...DEFAULT_APPEARANCE, ...currentAppearance(), ...next, at: Date.now() };
  writeStored(getOwner(), full);
  notify();
  return full;
}

/**
 * Switches whose look is showing: a user id after sign-in, or null after sign-out. A signed-in
 * account adopts its profile copy (profileRaw) when that is newer than this browser's copy.
 * Returns this browser's copy when it is the newer one, so the caller can send it to the profile.
 */
export function setAppearanceOwner(id: string | null, profileRaw?: unknown): StoredAppearance | null {
  const nextOwner = id ?? GUEST;
  let upload: StoredAppearance | null = null;
  if (id) {
    const profile = cleanAppearance(profileRaw);
    const local = readStored(id);
    if (hasChoice(profile) && (!local || (profile.at ?? 0) > (local.at ?? 0))) writeStored(id, { ...profile, at: profile.at ?? 0 });
    else if (local && (local.at ?? 0) > (profile.at ?? 0)) upload = local;
  }
  owner = nextOwner;
  try {
    localStorage.setItem(ACTIVE_KEY, nextOwner);
  } catch {
    // Kept in memory for this visit.
  }
  notify();
  return upload;
}

function subscribe(onChange: () => void) {
  // Another tab changed a choice or who is signed in: read storage afresh.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && !e.key.startsWith(STORAGE_PREFIX) && !Object.values(LEGACY_KEYS).includes(e.key as never)) return;
    memory.clear();
    owner = null;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Whose look is showing: a user id, or "guest". */
export function useAppearanceOwner() {
  return useSyncExternalStore(subscribe, getOwner, () => GUEST);
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
