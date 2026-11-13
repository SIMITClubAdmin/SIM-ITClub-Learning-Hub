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
  { id: "sakura", label: "Sakura Pink", hint: "Dark · Sakura theme", base: "#0d0711", accent: "#f472b6" },
  { id: "winter", label: "Winter Frost", hint: "Dark · Winter theme", base: "#060d1a", accent: "#38bdf8" },
  { id: "purple-dark", label: "Purple & Black", hint: "Dark", base: "#07060e", accent: "#a855f7" },
  { id: "red-dark", label: "Red & Black", hint: "Dark", base: "#080506", accent: "#ef4444" },
  { id: "purple-light", label: "Purple & White", hint: "Light mode", base: "#f8f7fc", accent: "#7c3aed" },
] as const;

export const WORLDS = [
  { id: "pixel", label: "Default Pixel Grid", emoji: "▦", hint: "Animated pixel grid, [ · ] reticle cursor" },
  { id: "matrix", label: "Code Theme (Matrix Rain)", emoji: ">_", hint: "Falling code rain, [ >_ ] terminal cursor" },
  { id: "sakura", label: "Sakura Theme", emoji: "🌸", hint: "Cherry blossom tree and drifting petals, blossom cursor" },
  { id: "winter", label: "Winter Theme", emoji: "❄️", hint: "Snow, penguins and a Christmas tree, snowflake cursor" },
] as const;

export type FontId = (typeof FONTS)[number]["id"];
export type PaletteId = (typeof PALETTES)[number]["id"];
export type WorldId = (typeof WORLDS)[number]["id"];
export type Appearance = { font: FontId; palette: PaletteId; world: WorldId };
/** A saved choice: at is when it was made, so the newest copy (browser or profile) wins. */
export type StoredAppearance = Partial<Appearance> & { at?: number };

export const DEFAULT_APPEARANCE: Appearance = { font: "site", palette: "navy", world: "pixel" };
/** Theme worlds that bring their own palette when picked. */
export const WORLD_PALETTE: Partial<Record<WorldId, PaletteId>> = { matrix: "matrix", sakura: "sakura", winter: "winter" };

/**
 * Browser storage: each account keeps its own copy under itcamp_theme_<user id>, signed-out
 * visitors use itcamp_theme_guest, and itcamp_theme_active names whose copy is showing, so the
 * script below can apply it before first paint.
 */
export const STORAGE_PREFIX = "itcamp_theme_";
export const GUEST = "guest";
export const ACTIVE_KEY = "itcamp_theme_active";
/** Where choices lived before they were kept per account. Read once, for the guest copy. */
export const LEGACY_KEYS = { font: "hub-font", palette: "hub-palette", world: "hub-world" } as const;

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

const KINDS = (Object.keys(ATTRS) as (keyof Appearance)[]).map((k) => [k, ATTRS[k], IDS[k], DEFAULT_APPEARANCE[k]]);

/**
 * Runs during HTML parsing, before first paint, on every full page load: applies the active
 * account's copy, else this browser's guest copy (else the old pre-account keys).
 */
export const APPEARANCE_SCRIPT = `(function(){try{var d=document.documentElement,s=localStorage,o=s.getItem(${JSON.stringify(ACTIVE_KEY)})||${JSON.stringify(GUEST)};function g(k){try{var v=JSON.parse(s.getItem(${JSON.stringify(STORAGE_PREFIX)}+k)||"null");return v&&typeof v==="object"?v:null}catch(e){return null}}var a=g(o)||g(${JSON.stringify(GUEST)})||{font:s.getItem(${JSON.stringify(LEGACY_KEYS.font)}),palette:s.getItem(${JSON.stringify(LEGACY_KEYS.palette)}),world:s.getItem(${JSON.stringify(LEGACY_KEYS.world)})},c=${JSON.stringify(KINDS)};for(var i=0;i<c.length;i++){var v=a[c[i][0]];if(c[i][2].indexOf(v)>-1&&v!==c[i][3])d.setAttribute(c[i][1],v)}}catch(e){}})()`;
