"use client";

import { useCallback, useSyncExternalStore } from "react";

export const THEMES = [
  { id: "purple-dark", label: "Purple & Black", base: "#07060e", accent: "#a855f7" },
  { id: "red-dark", label: "Red & Black", base: "#080506", accent: "#ef4444" },
  { id: "purple-light", label: "Purple & White", base: "#f8f7fc", accent: "#7c3aed" },
] as const;

export const FONTS = [
  { id: "site", label: "Site default" },
  { id: "jetbrains", label: "JetBrains Mono" },
  { id: "jakarta", label: "Plus Jakarta Sans" },
  { id: "comic", label: "Comic Sans" },
  { id: "times", label: "Times New Roman" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type FontId = (typeof FONTS)[number]["id"];

export const DEFAULT_THEME: ThemeId = "purple-dark";
export const DEFAULT_FONT: FontId = "site";
export const THEME_KEY = "gs-theme";
export const FONT_KEY = "gs-font";
export const THEME_ROOT_ID = "gs-theme-root";

const THEME_IDS: readonly string[] = THEMES.map((t) => t.id);
const FONT_IDS: readonly string[] = FONTS.map((f) => f.id);
const CHANGE_EVENT = "gs-appearance-change";

/** Choices made this visit, so the toolbar still works when storage is blocked. */
const memory: Record<string, string> = {};

function read<T extends string>(key: string, allowed: readonly string[], fallback: T): T {
  let value: string | null | undefined = memory[key];
  if (value === undefined) {
    try {
      value = localStorage.getItem(key);
    } catch {
      value = null;
    }
  }
  return value && allowed.includes(value) ? (value as T) : fallback;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(key: string, value: string) {
  memory[key] = value;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private windows can block storage; the choice still lasts for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * The student's theme and font. The server always renders the defaults; the inline script
 * in GitTrackLayout applies the saved choice before first paint, and this store agrees
 * with it straight after hydration, so there is no flash and no hydration error.
 */
export function useAppearance() {
  const theme = useSyncExternalStore(subscribe, () => read(THEME_KEY, THEME_IDS, DEFAULT_THEME), () => DEFAULT_THEME);
  const font = useSyncExternalStore(subscribe, () => read(FONT_KEY, FONT_IDS, DEFAULT_FONT), () => DEFAULT_FONT);
  const setTheme = useCallback((id: ThemeId) => write(THEME_KEY, id), []);
  const setFont = useCallback((id: FontId) => write(FONT_KEY, id), []);
  return { theme, font, setTheme, setFont };
}

/** Runs before first paint on a full page load (the Git page is always one). */
export const APPEARANCE_SCRIPT = `(function(){try{var r=document.getElementById(${JSON.stringify(THEME_ROOT_ID)});if(!r)return;var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)}),f=localStorage.getItem(${JSON.stringify(FONT_KEY)});if(${JSON.stringify(THEME_IDS)}.indexOf(t)>-1){r.setAttribute("data-gs-theme",t);if(t==="purple-light")r.setAttribute("data-tone","light");else r.removeAttribute("data-tone")}if(${JSON.stringify(
  FONT_IDS,
)}.indexOf(f)>-1)r.setAttribute("data-gs-font",f)}catch(e){}})()`;
