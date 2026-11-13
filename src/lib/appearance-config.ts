/**
 * Site-wide appearance: reading font, colour palette and "theme world" (animated
 * background plus cursor). Each lives as a data attribute on <html>, which globals.css
 * and the background and cursor components read. Defaults have no attribute at all, so
 * the site looks exactly as designed until a member picks something.
 */
export const FONTS = [
  { id: "site", label: "Site default", hint: "Chakra Petch headings, Space Grotesk text" },
  { id: "jetbrains", label: "JetBrains Mono", hint: "Monospace everywhere" },
  { id: "jakarta", label: "Plus Jakarta Sans", hint: "Clean, modern Google Font" },
  { id: "comic", label: "Comic Sans", hint: "Friendly and easy to read" },
  { id: "times", label: "Times New Roman", hint: "Classic serif" },
] as const;

/** Swatch colours for the picker. The real values are the tokens in globals.css. */
export const PALETTES = [
  { id: "navy", label: "Cyber Navy", hint: "Default", base: "#070b1f", accent: "#4fd8eb" },
  { id: "matrix", label: "Matrix Green", hint: "Dark · Code theme", base: "#040805", accent: "#22c55e" },
  { id: "purple-dark", label: "Purple & Black", hint: "Dark", base: "#07060e", accent: "#a855f7" },
  { id: "red-dark", label: "Red & Black", hint: "Dark", base: "#080506", accent: "#ef4444" },
  { id: "purple-light", label: "Purple & White", hint: "Light mode", base: "#f8f7fc", accent: "#7c3aed" },
] as const;

export const WORLDS = [
  { id: "pixel", label: "Default Pixel Grid", emoji: "▦", hint: "Animated pixel grid, [ · ] reticle cursor" },
  { id: "matrix", label: "Code Theme (Matrix Rain)", emoji: ">_", hint: "Falling code rain, [ >_ ] terminal cursor" },
] as const;

export type FontId = (typeof FONTS)[number]["id"];
export type PaletteId = (typeof PALETTES)[number]["id"];
export type WorldId = (typeof WORLDS)[number]["id"];
export type Appearance = { font: FontId; palette: PaletteId; world: WorldId };

export const DEFAULT_APPEARANCE: Appearance = { font: "site", palette: "navy", world: "pixel" };
export const KEYS = { font: "hub-font", palette: "hub-palette", world: "hub-world" } as const;
export const IDS = {
  font: FONTS.map((f) => f.id) as string[],
  palette: PALETTES.map((p) => p.id) as string[],
  world: WORLDS.map((w) => w.id) as string[],
};
export const ATTRS = { font: "data-font", palette: "data-palette", world: "data-world" } as const;
export const CHANGE_EVENT = "hub-appearance-change";

/** Puts the choice on <html>. Defaults remove the attribute, so CSS falls back to the original design. */
export function applyToDocument(appearance: Appearance) {
  const root = document.documentElement;
  for (const key of Object.keys(ATTRS) as (keyof Appearance)[]) {
    if (appearance[key] === DEFAULT_APPEARANCE[key]) root.removeAttribute(ATTRS[key]);
    else root.setAttribute(ATTRS[key], appearance[key]);
  }
}

/** Runs during HTML parsing, before first paint, on every full page load. */
export const APPEARANCE_SCRIPT = `(function(){try{var d=document.documentElement,s=localStorage;${(Object.keys(KEYS) as (keyof Appearance)[])
  .map(
    (k) =>
      `var ${k}=s.getItem(${JSON.stringify(KEYS[k])});if(${JSON.stringify(IDS[k])}.indexOf(${k})>-1&&${k}!==${JSON.stringify(DEFAULT_APPEARANCE[k])})d.setAttribute(${JSON.stringify(ATTRS[k])},${k});`,
  )
  .join("")}}catch(e){}})()`;
