import type { PaletteId, WorldId } from "./appearance-config";
import type { PlanetPalette } from "./topics";

/**
 * How the lesson planets and their moons look under each theme world:
 *   gas    the classic banded, ringed planet (Default Pixel Grid), tinted to the palette
 *   cyber  a holographic data sphere with a neon wireframe (Code Theme)
 *   sakura a blossom moon with misty cloud bands and silk rings (Sakura Theme)
 *   ice    a glacial planet with frost bands, a polar cap and an aurora (Winter Theme)
 * Each lesson planet gets its own hue within the theme, so the planets stay distinct.
 */
export type PlanetKind = "gas" | "cyber" | "sakura" | "ice";

/** A moon's CSS: its fill, border, label colour and glow. Colours may be CSS variables. */
export type MoonLook = { background: string; border?: string; color?: string; glow?: string };

export type PlanetLook = {
  kind: PlanetKind;
  /** Body, band, ring and glow colours in the lesson palette's shape (the Challenge page uses these). */
  palette: PlanetPalette;
  /** Body gradient, highlight to shadow (cyber: centre to edge). */
  body: string[];
  /** Wireframe and ring lines, then their brighter highlight. */
  line: string;
  bright: string;
  /** The two ring colours, inner and outer. */
  rings: [string, string];
  /** The dashed moon orbit. */
  orbit: string;
  moons: MoonLook[];
  locked: MoonLook;
  playground: MoonLook;
};

const KIND: Record<WorldId, PlanetKind> = { pixel: "gas", matrix: "cyber", sakura: "sakura", winter: "ice" };

/** Lesson planets in order (HTML/CSS/JS, Git, Lesson 3...), each with its own hue. */
const pickVariant = <T,>(list: T[], index: number) => list[((index % list.length) + list.length) % list.length];

/** A dark terminal moon: scanlines, a neon border and a monospace glow. */
function terminal(border: string, fill: string, label: string): MoonLook {
  return {
    background: `repeating-linear-gradient(0deg, ${border}24 0 1px, transparent 1px 4px), radial-gradient(circle at 50% 30%, ${border}38, transparent 62%), ${fill}`,
    border: `2px solid ${border}`,
    color: label,
    glow: `${border}99`,
  };
}

/** A soft blossom orb: a pearly highlight over a two-tone wash. */
function blossom(from: string, to: string, rim: string, label: string): MoonLook {
  return {
    background: `radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.6), transparent 46%), linear-gradient(140deg, ${from}, ${to})`,
    border: `2px solid ${rim}`,
    color: label,
    glow: `${to}88`,
  };
}

/** A festive ornament moon with snow resting on top. */
function ornament(light: string, mid: string, deep: string, rim: string, label: string): MoonLook {
  return {
    background: `radial-gradient(ellipse 64% 30% at 50% 4%, #ffffff 0 58%, transparent 66%), radial-gradient(circle at 35% 38%, ${light}, ${mid} 48%, ${deep})`,
    border: `2px solid ${rim}`,
    color: label,
    glow: `${mid}88`,
  };
}

type Variant = Omit<PlanetLook, "kind" | "palette" | "locked"> & { glow: string; rim: string };

const CYBER: Variant[] = [
  // HTML, CSS and JavaScript: Cyber Cyan.
  {
    body: ["#0a3340", "#06222a", "#03090b"],
    line: "#22d3ee",
    bright: "#67e8f9",
    rings: ["#06b6d4", "#67e8f9"],
    orbit: "#67e8f9",
    glow: "#22d3ee",
    rim: "#67e8f9",
    moons: [terminal("#22d3ee", "#041418", "#a5f3fc"), terminal("#06b6d4", "#041418", "#a5f3fc"), terminal("#67e8f9", "#041418", "#cffafe")],
    playground: terminal("#22d3ee", "#041418", "#a5f3fc"),
  },
  // Git and GitHub: Matrix Emerald.
  {
    body: ["#0a3a20", "#062415", "#030906"],
    line: "#22c55e",
    bright: "#4ade80",
    rings: ["#10b981", "#4ade80"],
    orbit: "#4ade80",
    glow: "#22c55e",
    rim: "#4ade80",
    moons: [terminal("#22c55e", "#05140c", "#86efac"), terminal("#10b981", "#05140c", "#86efac"), terminal("#34d399", "#05140c", "#a7f3d0")],
    playground: terminal("#22c55e", "#05140c", "#86efac"),
  },
  // Lesson 3: Terminal Lime.
  {
    body: ["#25360a", "#1a2606", "#070a02"],
    line: "#a3e635",
    bright: "#bef264",
    rings: ["#84cc16", "#bef264"],
    orbit: "#bef264",
    glow: "#a3e635",
    rim: "#bef264",
    moons: [terminal("#a3e635", "#0f1704", "#d9f99d"), terminal("#84cc16", "#0f1704", "#d9f99d"), terminal("#bef264", "#0f1704", "#ecfccb")],
    playground: terminal("#a3e635", "#0f1704", "#d9f99d"),
  },
  // A fourth lesson: Phosphor Mint.
  {
    body: ["#0b3a30", "#062a22", "#03100c"],
    line: "#6ee7b7",
    bright: "#a7f3d0",
    rings: ["#34d399", "#a7f3d0"],
    orbit: "#a7f3d0",
    glow: "#6ee7b7",
    rim: "#a7f3d0",
    moons: [terminal("#6ee7b7", "#04130f", "#d1fae5"), terminal("#34d399", "#04130f", "#d1fae5"), terminal("#a7f3d0", "#04130f", "#ecfdf5")],
    playground: terminal("#6ee7b7", "#04130f", "#d1fae5"),
  },
];

const SAKURA: Variant[] = [
  // Lavender Blossom.
  {
    body: ["#faf5ff", "#e9d5ff", "#c084fc", "#6b21a8", "#3b0764"],
    line: "#faf5ff",
    bright: "#f3e8ff",
    rings: ["#d8b4fe", "#c084fc"],
    orbit: "#e9d5ff",
    glow: "#d8b4fe",
    rim: "#f3e8ff",
    moons: [blossom("#f9a8d4", "#f472b6", "#fce7f3", "#500724"), blossom("#a5b4fc", "#818cf8", "#e0e7ff", "#1e1b4b"), blossom("#f0abfc", "#d946ef", "#fae8ff", "#4a044e")],
    playground: blossom("#fbcfe8", "#f9a8d4", "#fdf2f8", "#500724"),
  },
  // Blush Rose: the Git planet, beside the bonsai.
  {
    body: ["#fff1f2", "#fbcfe8", "#f472b6", "#831843", "#500724"],
    line: "#fff1f2",
    bright: "#fdf2f8",
    rings: ["#f9a8d4", "#f472b6"],
    orbit: "#f9a8d4",
    glow: "#f9a8d4",
    rim: "#fbcfe8",
    moons: [
      { ...blossom("#fda4af", "#fb7185", "#ffe4e6", "#4c0519"), background: "radial-gradient(circle at 34% 28%, #ffe4e6, #fb7185 46%, #e11d48)" },
      blossom("#f472b6", "#fbbf24", "#fde68a", "#451a03"),
      blossom("#c084fc", "#e879f9", "#fbcfe8", "#3b0764"),
    ],
    playground: blossom("#fbcfe8", "#f9a8d4", "#fdf2f8", "#500724"),
  },
  // Peach Petal.
  {
    body: ["#fff7ed", "#fed7aa", "#fb923c", "#9a3412", "#431407"],
    line: "#fff7ed",
    bright: "#ffedd5",
    rings: ["#fdba74", "#fb7185"],
    orbit: "#fed7aa",
    glow: "#fdba74",
    rim: "#ffedd5",
    moons: [blossom("#fda4af", "#fb7185", "#ffe4e6", "#4c0519"), blossom("#fdba74", "#f97316", "#ffedd5", "#431407"), blossom("#fcd34d", "#f59e0b", "#fef3c7", "#451a03")],
    playground: blossom("#fed7aa", "#fdba74", "#fff7ed", "#431407"),
  },
  // Ruby Sakura.
  {
    body: ["#ffe4e6", "#fda4af", "#e11d48", "#881337", "#4c0519"],
    line: "#ffe4e6",
    bright: "#fff1f2",
    rings: ["#fda4af", "#e11d48"],
    orbit: "#fda4af",
    glow: "#fb7185",
    rim: "#ffe4e6",
    moons: [blossom("#fb7185", "#e11d48", "#ffe4e6", "#fff1f2"), blossom("#f9a8d4", "#ec4899", "#fce7f3", "#500724"), blossom("#fda4af", "#be123c", "#ffe4e6", "#fff1f2")],
    playground: blossom("#fda4af", "#fb7185", "#fff1f2", "#4c0519"),
  },
];

const ICE: Variant[] = [
  // Aurora Teal.
  {
    body: ["#f0fdfa", "#5eead4", "#0d9488", "#134e4a"],
    line: "#ccfbf1",
    bright: "#ffffff",
    rings: ["#99f6e4", "#2dd4bf"],
    orbit: "#ccfbf1",
    glow: "#2dd4bf",
    rim: "#ccfbf1",
    moons: [ornament("#fca5a5", "#ef4444", "#991b1b", "#fee2e2", "#ffffff"), ornament("#a7f3d0", "#34d399", "#047857", "#d1fae5", "#022c22"), ornament("#fde68a", "#fbbf24", "#b45309", "#e0f2fe", "#451a03")],
    playground: ornament("#f0f9ff", "#bae6fd", "#38bdf8", "#e0f2fe", "#082f49"),
  },
  // Glacial Blue: the Git planet.
  {
    body: ["#f0f9ff", "#7dd3fc", "#0284c7", "#0c4a6e"],
    line: "#e0f2fe",
    bright: "#ffffff",
    rings: ["#bae6fd", "#38bdf8"],
    orbit: "#e0f2fe",
    glow: "#38bdf8",
    rim: "#e0f2fe",
    moons: [ornament("#fca5a5", "#ef4444", "#991b1b", "#fee2e2", "#ffffff"), ornament("#fde68a", "#fbbf24", "#f59e0b", "#e0f2fe", "#451a03"), ornament("#bae6fd", "#38bdf8", "#0284c7", "#bae6fd", "#082f49")],
    playground: ornament("#f0f9ff", "#bae6fd", "#38bdf8", "#e0f2fe", "#082f49"),
  },
  // Frost Violet.
  {
    body: ["#f5f3ff", "#c4b5fd", "#7c3aed", "#2e1065"],
    line: "#ede9fe",
    bright: "#ffffff",
    rings: ["#ddd6fe", "#a78bfa"],
    orbit: "#ede9fe",
    glow: "#a78bfa",
    rim: "#ede9fe",
    moons: [ornament("#ddd6fe", "#a78bfa", "#6d28d9", "#ede9fe", "#2e1065"), ornament("#fca5a5", "#ef4444", "#991b1b", "#fee2e2", "#ffffff"), ornament("#fde68a", "#fbbf24", "#b45309", "#e0f2fe", "#451a03")],
    playground: ornament("#f0f9ff", "#bae6fd", "#38bdf8", "#e0f2fe", "#082f49"),
  },
  // Festive Gold and Crimson.
  {
    body: ["#fffbeb", "#fcd34d", "#d97706", "#78350f"],
    line: "#fef3c7",
    bright: "#ffffff",
    rings: ["#fde68a", "#f87171"],
    orbit: "#fef3c7",
    glow: "#fbbf24",
    rim: "#fef3c7",
    moons: [ornament("#fca5a5", "#ef4444", "#991b1b", "#fee2e2", "#ffffff"), ornament("#bbf7d0", "#22c55e", "#15803d", "#dcfce7", "#052e16"), ornament("#bae6fd", "#38bdf8", "#0284c7", "#bae6fd", "#082f49")],
    playground: ornament("#f0f9ff", "#bae6fd", "#38bdf8", "#e0f2fe", "#082f49"),
  },
];

const LOCKED: Record<PlanetKind, MoonLook> = {
  gas: { background: "var(--bg-elevated)", border: "2px solid var(--border-subtle)" },
  cyber: { background: "#05140c", border: "2px dashed #1f5135" },
  sakura: { background: "#2a1020", border: "2px dashed #6b2a4a" },
  ice: { background: "#0b1a2e", border: "2px dashed #2b5079" },
};

/** The lesson palette rebuilt from a theme variant, for the Challenge page's simpler planets. */
function paletteFrom(v: Variant, own: PlanetPalette, kind: PlanetKind): PlanetPalette {
  const b = v.body;
  const bands = kind === "cyber" ? [v.line, b[0], v.bright, b[1], v.line, b[0]] : [b[1], b[0], b[2], b[1], b[Math.min(3, b.length - 1)], b[2]];
  return {
    base: kind === "cyber" ? b[1] : b[Math.min(2, b.length - 1)],
    bands,
    storm: v.bright,
    rim: v.rim,
    ring: v.rings[0],
    glow: v.glow,
    moons: v.moons.map((m, i) => m.border?.split(" ").pop() ?? own.moons[i] ?? v.glow),
  };
}

/**
 * The look for lesson planet number index (0-based) under the chosen theme world and palette.
 * own is the lesson's classic palette, used as is for the default Cyber Navy look.
 */
export function planetLook(world: WorldId, paletteId: PaletteId, index: number, own: PlanetPalette): PlanetLook {
  const kind = KIND[world];
  if (kind === "gas") {
    const navy = paletteId === "navy";
    // Other palettes keep each lesson's colours but take the palette's accent for the
    // atmosphere, ring highlights, orbit and moon rims, so nothing clashes.
    const palette: PlanetPalette = navy
      ? own
      : { ...own, glow: "var(--accent-primary)", rim: "var(--accent-text)", ring: `color-mix(in srgb, ${own.ring} 55%, var(--accent-primary))` };
    return {
      kind,
      palette,
      body: [own.base],
      line: palette.ring,
      bright: palette.rim,
      rings: [palette.ring, palette.ring],
      orbit: navy ? "#94aaff" : "var(--accent-text)",
      moons: own.moons.map((background) => (navy ? { background } : { background, border: "2px solid var(--accent-primary)", glow: "color-mix(in srgb, var(--accent-primary) 45%, transparent)" })),
      locked: navy ? { background: "#232a52" } : LOCKED.gas,
      playground: navy ? { background: "#e8835f" } : { background: "#e8835f", border: "2px solid var(--accent-primary)" },
    };
  }
  const v = pickVariant(kind === "cyber" ? CYBER : kind === "sakura" ? SAKURA : ICE, index);
  return { kind, ...v, palette: paletteFrom(v, own, kind), locked: LOCKED[kind] };
}
