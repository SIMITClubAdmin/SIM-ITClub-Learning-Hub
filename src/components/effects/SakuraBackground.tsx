"use client";

import { useRef } from "react";
import { css, isLight, pick, rand, seeded, tokenRgb, useCanvasScene, type Rgb, type Scene } from "./canvas-scene";

/*
 * The Sakura theme: a windswept bonsai cherry tree in an ink-and-watercolour style, on a rocky
 * slope in the bottom-right corner. The tree is drawn once per size, in its own units (trunk
 * base at 0,0, up is negative y, about 1,180 units from the crown to the bottom of the rock),
 * back to front in five layers:
 *   1. the rock, its gripping roots and a bed of fallen petals,
 *   2. soft watercolour washes behind each blossom pad,
 *   3. the S-curve trunk and crooked boughs, with bark lines and a faint rim light,
 *   4. five-petal blossoms, drawn 60% / dark twigs / 40% so the ink branches weave through
 *      the pink, with buds on the twig tips,
 *   5. (per frame) the outer pads and the hanging right bough swaying, and petals letting go.
 */

type Pt = { x: number; y: number };
type Curve = [Pt, Pt, Pt, Pt];
/** A tapering limb along one or more cubic curves; widths has one entry per joint. */
type Limb = { curves: Curve[]; widths: number[]; bark: number };
type Pad = { c: Pt; rx: number; ry: number; attach: Pt; spawn: number; sway?: { anchor: Pt; amp: number; phase: number }; limb?: Limb };

const P = (x: number, y: number): Pt => ({ x, y });

/** The S-curve trunk: sweeps left off the rock, back to the right, then up into the crown. */
const TRUNK: Limb = {
  curves: [
    [P(0, 0), P(-14, -96), P(-238, -122), P(-196, -290)],
    [P(-196, -290), P(-166, -420), P(84, -372), P(60, -522)],
    [P(60, -522), P(52, -622), P(4, -680), P(20, -782)],
  ],
  widths: [84, 62, 40, 22],
  bark: 24,
};

/** Crooked boughs, each starting inside the trunk. */
const BOUGHS: Limb[] = [
  // The long right bough, reaching out and dipping; its hanging end belongs to the cascade pad.
  { curves: [[P(56, -545), P(170, -592), P(300, -556), P(392, -470)]], widths: [28, 10], bark: 5 },
  { curves: [[P(50, -615), P(-30, -672), P(-160, -654), P(-252, -594)]], widths: [20, 6], bark: 4 },
  { curves: [[P(22, -742), P(-30, -802), P(-92, -832), P(-152, -840)]], widths: [12, 4], bark: 3 },
  { curves: [[P(24, -748), P(80, -792), P(142, -832), P(192, -860)]], widths: [12, 4], bark: 3 },
  { curves: [[P(20, -776), P(32, -822), P(20, -862), P(36, -906)]], widths: [14, 4], bark: 3 },
  { curves: [[P(44, -672), P(10, -692), P(-40, -702), P(-80, -714)]], widths: [9, 3], bark: 2 },
  { curves: [[P(56, -642), P(90, -662), P(122, -682), P(152, -702)]], widths: [9, 3], bark: 2 },
  { curves: [[P(180, -566), P(196, -536), P(206, -504), P(216, -472)]], widths: [7, 3], bark: 1 },
];

/** Seven to nine blossom pads: crown, upper boughs, mid canopy and the cascade on the right. spawn weights where petals let go. */
const PADS: Pad[] = [
  { c: P(30, -935), rx: 150, ry: 78, attach: P(36, -906), spawn: 0.04 },
  { c: P(-178, -868), rx: 128, ry: 70, attach: P(-152, -840), spawn: 0.04, sway: { anchor: P(-152, -840), amp: 0.012, phase: 1.3 } },
  { c: P(218, -882), rx: 138, ry: 70, attach: P(192, -860), spawn: 0.04, sway: { anchor: P(192, -860), amp: 0.012, phase: 2.1 } },
  { c: P(-288, -602), rx: 118, ry: 60, attach: P(-252, -594), spawn: 0.06, sway: { anchor: P(-252, -594), amp: 0.016, phase: 0.4 } },
  { c: P(-100, -738), rx: 114, ry: 60, attach: P(-80, -714), spawn: 0.03 },
  { c: P(178, -722), rx: 140, ry: 70, attach: P(152, -702), spawn: 0.05 },
  { c: P(332, -548), rx: 120, ry: 60, attach: P(330, -538), spawn: 0.14, sway: { anchor: P(262, -566), amp: 0.014, phase: 3.0 } },
  {
    c: P(482, -372),
    rx: 84,
    ry: 104,
    attach: P(470, -400),
    spawn: 0.3,
    // The hanging end of the right bough sways with its blossoms, pivoting where it bends down.
    sway: { anchor: P(392, -470), amp: 0.024, phase: 0.9 },
    limb: { curves: [[P(392, -470), P(442, -430), P(484, -380), P(500, -296)]], widths: [9, 3], bark: 1 },
  },
  { c: P(228, -455), rx: 84, ry: 48, attach: P(216, -472), spawn: 0.1 },
];

/** The top of the rock, left to right; the slope falls away to the right. */
const ROCK: Pt[] = [P(-530, 74), P(-476, 30), P(-404, 6), P(-332, -6), P(-242, -16), P(-142, -30), P(-60, -12), P(0, 6), P(90, 22), P(182, 42), P(300, 72), P(420, 104), P(560, 146), P(720, 196)];

/** Roots: from a point at the base to a point on the rock (x positions), and their thickness. */
const ROOTS = [
  [-40, -236, 28],
  [-18, -126, 20],
  [-56, -340, 16],
  [8, 62, 15],
  [22, 128, 22],
  [44, 254, 28],
];

/** Blossom tones: blush, soft pink, rose and deep accent. */
const TONES = [
  { outer: "#fff1f2", inner: "#fce7f3", edge: "rgba(244, 114, 182, 0.4)" },
  { outer: "#fbcfe8", inner: "#f9a8d4", edge: "rgba(219, 39, 119, 0.32)" },
  { outer: "#f9a8d4", inner: "#f472b6", edge: "rgba(190, 24, 93, 0.36)" },
  { outer: "#f472b6", inner: "#db2777", edge: "rgba(131, 24, 67, 0.42)" },
];
const PETALS = ["#fff1f2", "#fce7f3", "#fbcfe8", "#f9a8d4", "#f9a8d4", "#f472b6"];

type Bloom = { x: number; y: number; r: number; rot: number; tone: number; alpha: number };
type Twig = { pts: Pt[]; w0: number; w1: number };
type Bud = { x: number; y: number; rot: number };
type PadPlan = { pad: Pad; washes: { x: number; y: number; r: number }[]; back: Bloom[]; twigs: Twig[]; front: Bloom[]; buds: Bud[] };
type Sprite = { canvas: HTMLCanvasElement; box: { x: number; y: number; w: number; h: number }; sway: NonNullable<Pad["sway"]> };
type Petal = { x: number; y: number; size: number; fall: number; sway: number; swayRate: number; phase: number; rot: number; spin: number; flip: number; flipRate: number; colour: string; alpha: number };

function bezier([a, b, c, d]: Curve, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

function rockY(x: number) {
  if (x <= ROCK[0].x) return ROCK[0].y;
  for (let i = 0; i < ROCK.length - 1; i++) {
    const a = ROCK[i];
    const b = ROCK[i + 1];
    if (x <= b.x) return a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
  }
  return ROCK[ROCK.length - 1].y;
}

/** A petal: a rounded teardrop with the little notch at its tip, centred on (0, 0). */
function petalPath(c: CanvasRenderingContext2D, s: number) {
  c.beginPath();
  c.moveTo(0, s);
  c.bezierCurveTo(-s * 0.95, s * 0.35, -s * 0.8, -s * 0.85, -s * 0.22, -s);
  c.lineTo(0, -s * 0.7);
  c.lineTo(s * 0.22, -s);
  c.bezierCurveTo(s * 0.8, -s * 0.85, s * 0.95, s * 0.35, 0, s);
  c.closePath();
}

/** One five-petal blossom with notched petals and a deep pink heart, drawn once per tone and stamped. */
function makeStamp(tone: (typeof TONES)[number]) {
  const canvas = document.createElement("canvas");
  canvas.width = 72;
  canvas.height = 72;
  const s = canvas.getContext("2d")!;
  const L = 32;
  s.translate(36, 36);
  for (let i = 0; i < 5; i++) {
    s.save();
    s.rotate((i * Math.PI * 2) / 5);
    s.beginPath();
    s.moveTo(0, 0);
    s.bezierCurveTo(-L * 0.62, -L * 0.22, -L * 0.66, -L * 0.86, -L * 0.2, -L);
    s.lineTo(0, -L * 0.84);
    s.lineTo(L * 0.2, -L);
    s.bezierCurveTo(L * 0.66, -L * 0.86, L * 0.62, -L * 0.22, 0, 0);
    s.closePath();
    const wash = s.createRadialGradient(0, 0, 0, 0, 0, L);
    wash.addColorStop(0, tone.inner);
    wash.addColorStop(1, tone.outer);
    s.globalAlpha = 0.94;
    s.fillStyle = wash;
    s.fill();
    s.globalAlpha = 1;
    s.strokeStyle = tone.edge;
    s.lineWidth = 1.2;
    s.stroke();
    s.restore();
  }
  const heart = s.createRadialGradient(0, 0, 0, 0, 0, 9);
  heart.addColorStop(0, "rgba(219, 39, 119, 0.75)");
  heart.addColorStop(1, "rgba(219, 39, 119, 0)");
  s.fillStyle = heart;
  s.beginPath();
  s.arc(0, 0, 9, 0, Math.PI * 2);
  s.fill();
  s.strokeStyle = "rgba(190, 24, 93, 0.6)";
  s.fillStyle = "rgba(190, 24, 93, 0.75)";
  s.lineWidth = 0.8;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const r = 6.5 + (i % 2) * 1.5;
    s.beginPath();
    s.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
    s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    s.stroke();
    s.beginPath();
    s.arc(Math.cos(a) * r, Math.sin(a) * r, 1.1, 0, Math.PI * 2);
    s.fill();
  }
  return canvas;
}

/** A line that wanders a little sideways between two points, like a hand-drawn twig. */
function crooked(from: Pt, to: Pt, segments: number, jitter: number, rnd: () => number): Pt[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const pts = [from];
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const off = (rnd() - 0.5) * 2 * jitter * len;
    pts.push({ x: from.x + dx * t - (dy / len) * off, y: from.y + dy * t + (dx / len) * off });
  }
  pts.push(to);
  return pts;
}

/** Where every twig, blossom and bud goes. Seeded, so the tree is the same on every visit. */
function planPads(): PadPlan[] {
  const rnd = seeded(2026);
  const r = (a: number, b: number) => a + rnd() * (b - a);
  return PADS.map((pad) => {
    const { c, rx, ry, attach } = pad;
    const washes = Array.from({ length: 4 }, () => ({ x: c.x + r(-0.45, 0.45) * rx, y: c.y + r(-0.4, 0.4) * ry, r: ((rx + ry) / 2) * r(0.75, 1.1) }));

    // Dark twigs: a main twig carries on from the bough through the pad, with side twigs
    // reaching for its edges (mostly upward) and tiny twigs off those, ending a little past the
    // blossom with a bud.
    const twigs: Twig[] = [];
    const buds: Bud[] = [];
    const tips: { tip: Pt; from: Pt }[] = [];
    const edge = (angle: number, over: number) => ({ x: c.x + Math.cos(angle) * rx * over, y: c.y + Math.sin(angle) * ry * over });
    const through = Math.atan2(c.y - attach.y, c.x - attach.x);
    const far = edge(through + r(-0.25, 0.25), r(0.95, 1.1));
    const main = crooked(attach, far, 5, 0.06, rnd);
    twigs.push({ pts: main, w0: 4.4, w1: 1.4 });
    tips.push({ tip: far, from: main[main.length - 2] });
    const sides = 4 + Math.floor(rnd() * 3);
    for (let i = 0; i < sides; i++) {
      const along = main[1 + Math.floor(((i + 0.5) / sides) * (main.length - 2))];
      // Alternate sides of the main twig, biased toward the top of the pad.
      const up = i % 2 === 0 || rnd() < 0.3;
      const angle = up ? -Math.PI / 2 + r(-1.1, 1.1) : Math.PI / 2 + r(-0.9, 0.9);
      const end = edge(angle, up ? r(1.0, 1.16) : r(0.7, 0.95));
      const pts = crooked(along, end, 3, 0.1, rnd);
      twigs.push({ pts, w0: 2.8, w1: 1 });
      tips.push({ tip: end, from: pts[pts.length - 2] });
      if (rnd() < 0.6) {
        const mid = pts[1];
        const a2 = Math.atan2(end.y - along.y, end.x - along.x) + (rnd() < 0.5 ? -1 : 1) * r(0.5, 0.9);
        const len = Math.hypot(end.x - along.x, end.y - along.y) * r(0.3, 0.45);
        const tiny = { x: mid.x + Math.cos(a2) * len, y: mid.y + Math.sin(a2) * len };
        twigs.push({ pts: crooked(mid, tiny, 2, 0.12, rnd), w0: 1.6, w1: 0.8 });
        tips.push({ tip: tiny, from: mid });
      }
    }
    for (const { tip, from } of tips) buds.push({ x: tip.x, y: tip.y, rot: Math.atan2(tip.y - from.y, tip.x - from.x) + Math.PI / 2 });

    // Blossoms fill the pad, fuller on top; the top is paler and the underside deeper, for depth.
    const blooms: Bloom[] = [];
    const count = Math.round((rx * ry) / 115);
    for (let i = 0; i < count; i++) {
      const d = Math.sqrt(rnd()) * 0.98;
      const a = rnd() * Math.PI * 2;
      const y = c.y + Math.sin(a) * ry * d;
      if (y > c.y + ry * 0.45 && rnd() < 0.4) continue;
      const height = (y - (c.y - ry)) / (2 * ry);
      const tone = height < 0.3 ? (rnd() < 0.2 ? 0 : 1) : height < 0.65 ? (rnd() < 0.5 ? 1 : 2) : rnd() < 0.5 ? 2 : 3;
      blooms.push({ x: c.x + Math.cos(a) * rx * d, y, r: r(9, 15), rot: r(0, Math.PI * 2), tone, alpha: 1 });
    }
    // A few small blossoms out along the twigs, near their tips.
    for (const { tip } of tips) {
      if (rnd() < 0.35) continue;
      const t = r(0.7, 0.9);
      blooms.push({ x: c.x + (tip.x - c.x) * t, y: c.y + (tip.y - c.y) * t, r: r(6, 9), rot: r(0, Math.PI * 2), tone: 1 + Math.floor(r(0, 2)), alpha: 1 });
    }
    // 60% sit behind the twigs, a little deeper and softer; 40% in front, a little paler.
    const back: Bloom[] = [];
    const front: Bloom[] = [];
    for (const b of blooms) {
      if (rnd() < 0.6) back.push({ ...b, tone: Math.min(3, b.tone + (rnd() < 0.4 ? 1 : 0)), alpha: r(0.7, 0.88) });
      else front.push({ ...b, tone: Math.max(0, b.tone - (rnd() < 0.3 ? 1 : 0)), alpha: r(0.9, 1) });
    }
    return { pad, washes, back, twigs, front, buds };
  });
}

function createSakura(c: CanvasRenderingContext2D): Scene {
  let W = 0;
  let H = 0;
  let dpr = 1;
  let k = 1;
  let ox = 0;
  let oy = 0;
  let bg: Rgb = [13, 7, 17];
  let light = false;
  let tree: HTMLCanvasElement | null = null;
  let sprites: Sprite[] = [];
  let sky: CanvasGradient | null = null;
  let petals: Petal[] = [];
  const plan = planPads();
  let stamps: HTMLCanvasElement[] = [];

  function ink() {
    return light
      ? { rock: "#a08b7f", facetA: "#b8a598", facetB: "#8a756b", edge: "#5a463e", crack: "#3d2c26", smudge: "rgba(61, 44, 38, 0.22)", lit: "#5c4038", dark: "#2a1a19", hi: "#7d5a4c", lo: "#170d0c", rim: "rgba(255, 255, 255, 0.35)", twig: "#2a1a19" }
      : { rock: "#2d1822", facetA: "#583246", facetB: "#432639", edge: "#8f566c", crack: "#12070c", smudge: "rgba(8, 3, 6, 0.5)", lit: "#563042", dark: "#2a131e", hi: "#7a4259", lo: "#12070c", rim: "rgba(249, 168, 212, 0.34)", twig: "#4a2536" };
  }

  function readColours() {
    bg = tokenRgb(c, "--bg-base", [13, 7, 17]);
    light = isLight(bg);
  }

  /** Samples a limb into points with width, normal and progress along it. */
  function sample(limb: Limb, steps = 36) {
    const out: { p: Pt; w: number; s: number; n: Pt }[] = [];
    limb.curves.forEach((cv, i) => {
      for (let j = i === 0 ? 0 : 1; j <= steps; j++) {
        const t = j / steps;
        out.push({ p: bezier(cv, t), w: limb.widths[i] + (limb.widths[i + 1] - limb.widths[i]) * t, s: 0, n: P(0, 0) });
      }
    });
    out.forEach((o, i) => {
      o.s = i / (out.length - 1);
      const a = out[Math.max(0, i - 1)].p;
      const b = out[Math.min(out.length - 1, i + 1)].p;
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      o.n = P(-(b.y - a.y) / len, (b.x - a.x) / len);
    });
    return out;
  }

  /** A tapering, slightly gnarled limb with bark lines and (on dark palettes) a faint rim light. */
  function drawLimb(t: CanvasRenderingContext2D, limb: Limb, rnd: () => number, flare = false) {
    const col = ink();
    const pts = sample(limb);
    const width = (o: (typeof pts)[number]) => {
      const gnarl = 1 + 0.07 * Math.sin(o.s * 29) + 0.04 * Math.sin(o.s * 67 + 1);
      const base = flare && o.s < 0.1 ? 1 + (0.1 - o.s) * 6 : 1;
      return o.w * gnarl * base;
    };
    const left = pts.map((o) => P(o.p.x + (o.n.x * width(o)) / 2, o.p.y + (o.n.y * width(o)) / 2));
    const right = pts.map((o) => P(o.p.x - (o.n.x * width(o)) / 2, o.p.y - (o.n.y * width(o)) / 2));
    const xs = pts.map((o) => o.p.x);
    const grad = t.createLinearGradient(Math.min(...xs) - 30, 0, Math.max(...xs) + 30, 0);
    grad.addColorStop(0, col.lit);
    grad.addColorStop(1, col.dark);
    t.fillStyle = grad;
    t.beginPath();
    left.forEach((p, i) => (i ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)));
    for (let i = right.length - 1; i >= 0; i--) t.lineTo(right[i].x, right[i].y);
    t.closePath();
    t.fill();

    // Bark: thin lines that follow the limb and drift across it, so the wood looks twisted.
    const px = 1 / k;
    for (let j = 0; j < limb.bark; j++) {
      const f0 = (rnd() - 0.5) * 0.8;
      const from = rnd() * 0.5;
      const to = Math.min(1, from + 0.3 + rnd() * 0.5);
      t.strokeStyle = j % 2 ? col.hi : col.lo;
      t.lineWidth = (0.7 + rnd() * 0.9) * px;
      t.globalAlpha = 0.85;
      t.beginPath();
      let started = false;
      for (const o of pts) {
        if (o.s < from || o.s > to) continue;
        const f = f0 + 0.16 * Math.sin(o.s * 7 + j);
        const x = o.p.x + (o.n.x * width(o) * f) / 2;
        const y = o.p.y + (o.n.y * width(o) * f) / 2;
        if (started) t.lineTo(x, y);
        else {
          t.moveTo(x, y);
          started = true;
        }
      }
      t.stroke();
    }
    t.globalAlpha = 1;
    t.strokeStyle = col.rim;
    t.lineWidth = 1.3 * px;
    t.beginPath();
    left.forEach((p, i) => (i ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)));
    t.stroke();
  }

  /** Layer 1: the weathered rock, faceted and ink-washed, down to the bottom of the screen. */
  function drawRock(t: CanvasRenderingContext2D, rnd: () => number) {
    const col = ink();
    const r = (a: number, b: number) => a + rnd() * (b - a);
    const bottom = (H - oy) / k + 20;
    const last = ROCK[ROCK.length - 1];
    t.fillStyle = col.rock;
    t.beginPath();
    ROCK.forEach((p, i) => (i ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)));
    t.lineTo(last.x, bottom);
    t.lineTo(ROCK[0].x - 30, bottom);
    t.closePath();
    t.fill();
    for (let i = 0; i < ROCK.length - 1; i++) {
      const a = ROCK[i];
      const b = ROCK[i + 1];
      t.globalAlpha = r(0.55, 0.9);
      t.fillStyle = i % 2 ? col.facetA : col.facetB;
      t.beginPath();
      t.moveTo(a.x, a.y);
      t.lineTo(b.x, b.y);
      t.lineTo(b.x - r(0, 24), b.y + r(20, 54));
      t.lineTo(a.x + r(0, 24), a.y + r(20, 54));
      t.closePath();
      t.fill();
      // A lower facet, for a layered, broken face.
      t.globalAlpha = r(0.3, 0.6);
      t.fillStyle = i % 2 ? col.facetB : col.facetA;
      t.beginPath();
      t.moveTo(a.x + r(0, 20), a.y + r(46, 70));
      t.lineTo(b.x - r(0, 20), b.y + r(46, 70));
      t.lineTo(b.x - r(10, 40), b.y + r(90, 130));
      t.closePath();
      t.fill();
    }
    t.globalAlpha = 1;
    // Ink-wash shadows and cracks.
    for (let i = 0; i < 6; i++) {
      const x = r(ROCK[0].x, 520);
      const y = rockY(x) + r(40, 110);
      const g = t.createRadialGradient(x, y, 0, x, y, r(50, 110));
      g.addColorStop(0, col.smudge);
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      t.fillStyle = g;
      t.fillRect(x - 120, y - 120, 240, 240);
    }
    t.strokeStyle = col.crack;
    t.lineCap = "round";
    for (let i = 0; i < 18; i++) {
      const x = r(ROCK[0].x + 10, 560);
      const y = rockY(x) + r(8, 40);
      t.lineWidth = r(0.8, 1.8) / k;
      t.beginPath();
      t.moveTo(x, y);
      t.quadraticCurveTo(x + r(-12, 12), y + r(12, 30), x + r(-20, 20), y + r(26, 70));
      t.stroke();
    }
    // A sketchy highlight along the top edge, twice for a hand-drawn line.
    t.strokeStyle = col.edge;
    for (const pass of [0, 1]) {
      t.globalAlpha = pass ? 0.45 : 0.9;
      t.lineWidth = (pass ? 1.2 : 2.2) / k;
      t.beginPath();
      ROCK.forEach((p, i) => {
        const y = p.y + (pass ? r(1, 4) : 0);
        if (i) t.lineTo(p.x, y);
        else t.moveTo(p.x, y);
      });
      t.stroke();
    }
    t.globalAlpha = 1;
  }

  /** Gnarled roots gripping the rock, flowing from the foot of the trunk along the slope. */
  function drawRoots(t: CanvasRenderingContext2D, rnd: () => number) {
    for (const [sx, ex, w] of ROOTS) {
      const sy = rockY(sx) - 8;
      const ey = rockY(ex) + 3;
      const root: Limb = {
        curves: [[P(sx, sy), P(sx + (ex - sx) * 0.35, rockY(sx + (ex - sx) * 0.35) - 16), P(sx + (ex - sx) * 0.7, rockY(sx + (ex - sx) * 0.7) - 7), P(ex, ey)]],
        widths: [w, 2.5],
        bark: 2,
      };
      drawLimb(t, root, rnd);
    }
  }

  /** Fallen petals and a few whole blossoms resting on the rock around the base and down the slope. */
  function drawFallen(t: CanvasRenderingContext2D, rnd: () => number) {
    const r = (a: number, b: number) => a + rnd() * (b - a);
    for (let i = 0; i < 80; i++) {
      // Most gather near the trunk; the rest have blown down the slope.
      const x = rnd() < 0.6 ? r(-260, 260) : r(200, 620);
      const y = rockY(x) + r(-2, 16);
      t.save();
      t.translate(x, y);
      t.rotate(r(0, Math.PI * 2));
      t.scale(1, r(0.45, 0.8));
      t.globalAlpha = r(0.6, 0.95);
      t.fillStyle = PETALS[Math.floor(rnd() * PETALS.length)];
      petalPath(t, r(4, 7));
      t.fill();
      t.restore();
    }
    for (let i = 0; i < 7; i++) {
      const x = r(-200, 420);
      const y = rockY(x) + r(2, 12);
      const s = r(7, 10);
      t.save();
      t.translate(x, y);
      t.scale(1, 0.6);
      t.rotate(r(0, Math.PI * 2));
      t.globalAlpha = 0.9;
      t.drawImage(stamps[Math.floor(r(0, 3))], -s, -s, s * 2, s * 2);
      t.restore();
    }
    t.globalAlpha = 1;
  }

  /** Layer 2: soft watercolour washes behind a pad. */
  function drawWashes(t: CanvasRenderingContext2D, pp: PadPlan) {
    for (const w of pp.washes) {
      const g = t.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r);
      g.addColorStop(0, light ? "rgba(251, 207, 232, 0.45)" : "rgba(251, 207, 232, 0.28)");
      g.addColorStop(0.55, light ? "rgba(244, 114, 182, 0.18)" : "rgba(244, 114, 182, 0.14)");
      g.addColorStop(1, "rgba(244, 114, 182, 0)");
      t.fillStyle = g;
      t.fillRect(w.x - w.r, w.y - w.r, w.r * 2, w.r * 2);
    }
  }

  function drawBloom(t: CanvasRenderingContext2D, b: Bloom) {
    t.save();
    t.translate(b.x, b.y);
    t.rotate(b.rot);
    t.globalAlpha = b.alpha;
    t.drawImage(stamps[b.tone], -b.r, -b.r, b.r * 2, b.r * 2);
    t.restore();
  }

  /** Layer 4: blossoms behind, the dark twigs, blossoms in front, then buds on the tips. */
  function drawPad(t: CanvasRenderingContext2D, pp: PadPlan) {
    pp.back.forEach((b) => drawBloom(t, b));
    t.strokeStyle = ink().twig;
    t.lineCap = "round";
    t.lineJoin = "round";
    for (const twig of pp.twigs) {
      const n = twig.pts.length - 1;
      for (let i = 0; i < n; i++) {
        t.lineWidth = twig.w0 + ((twig.w1 - twig.w0) * i) / Math.max(1, n - 1);
        t.beginPath();
        t.moveTo(twig.pts[i].x, twig.pts[i].y);
        t.lineTo(twig.pts[i + 1].x, twig.pts[i + 1].y);
        t.stroke();
      }
    }
    pp.front.forEach((b) => drawBloom(t, b));
    for (const bud of pp.buds) {
      t.save();
      t.translate(bud.x, bud.y);
      t.rotate(bud.rot);
      t.fillStyle = "#be185d";
      t.beginPath();
      t.ellipse(0, 2.5, 2.2, 2, 0, 0, Math.PI * 2);
      t.fill();
      t.fillStyle = "#f472b6";
      t.beginPath();
      t.ellipse(0, -1.5, 3, 5, 0, 0, Math.PI * 2);
      t.fill();
      t.restore();
    }
  }

  function build() {
    stamps = TONES.map(makeStamp);
    const rnd = seeded(77);

    // Everything that stays still, in screen pixels.
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const t = canvas.getContext("2d");
    if (!t) return;
    t.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
    drawRock(t, rnd);
    drawRoots(t, rnd);
    drawFallen(t, rnd);
    const still = plan.filter((pp) => !pp.pad.sway);
    still.forEach((pp) => drawWashes(t, pp));
    BOUGHS.forEach((b) => drawLimb(t, b, rnd));
    drawLimb(t, TRUNK, rnd, true);
    still.forEach((pp) => drawPad(t, pp));
    tree = canvas;

    // The outer pads (and the hanging bough) each on their own canvas, so they can sway.
    sprites = plan
      .filter((pp) => pp.pad.sway)
      .map((pp) => {
        const { c: pc, rx, ry, sway, limb } = pp.pad;
        const xs = [pc.x - rx * 1.35 - 20, pc.x + rx * 1.35 + 20, sway!.anchor.x - 20];
        const ys = [pc.y - ry * 1.4 - 20, pc.y + ry * 1.4 + 20, sway!.anchor.y - 20];
        const box = { x: Math.min(...xs), y: Math.min(...ys), w: 0, h: 0 };
        box.w = Math.max(...xs) - box.x;
        box.h = Math.max(...ys) - box.y;
        const sc = document.createElement("canvas");
        sc.width = Math.max(1, Math.round(box.w * k * dpr));
        sc.height = Math.max(1, Math.round(box.h * k * dpr));
        const s = sc.getContext("2d")!;
        s.setTransform(k * dpr, 0, 0, k * dpr, -box.x * k * dpr, -box.y * k * dpr);
        drawWashes(s, pp);
        if (limb) drawLimb(s, limb, rnd);
        drawPad(s, pp);
        return { canvas: sc, box, sway: sway! };
      });

    // A faint glow (dark palettes) or a warm blush sky (light ones) around the crown.
    const gx = ox + 60 * k;
    const gy = oy - 700 * k;
    sky = c.createRadialGradient(gx, gy, 0, gx, gy, 900 * k);
    sky.addColorStop(0, light ? "rgba(252, 231, 243, 0.75)" : "rgba(244, 114, 182, 0.07)");
    sky.addColorStop(1, light ? "rgba(252, 231, 243, 0)" : "rgba(244, 114, 182, 0)");
  }

  /** A petal: most let go of the lower-right boughs, some of the crown, the rest drift in from above. */
  function petal(anywhere: boolean): Petal {
    let x = rand(-40, W + 40);
    let y = rand(-60, -10);
    let roll = Math.random();
    for (const pad of PADS) {
      roll -= pad.spawn;
      if (roll < 0) {
        x = ox + (pad.c.x + rand(-0.5, 0.5) * pad.rx) * k;
        y = oy + (pad.c.y + rand(0, 0.8) * pad.ry) * k;
        break;
      }
    }
    return {
      x: anywhere ? rand(0, W) : x,
      y: anywhere ? rand(0, H) : y,
      size: rand(3.4, 6.4),
      fall: rand(0.3, 0.7),
      sway: rand(0.2, 0.6),
      swayRate: rand(0.0008, 0.0018),
      phase: rand(0, Math.PI * 2),
      rot: rand(0, Math.PI * 2),
      spin: rand(-0.02, 0.02),
      flip: rand(0, Math.PI * 2),
      flipRate: rand(0.015, 0.04),
      colour: pick(PETALS),
      alpha: rand(0.55, 0.9),
    };
  }

  readColours();

  return {
    resize(width, height, ratio) {
      W = width;
      H = height;
      dpr = ratio;
      // As big as the screen allows while staying right of centred page text: up to ~88% of the height.
      k = Math.max(0.28, Math.min((H * 0.88) / 1180, (W * 0.4) / 940, 0.78));
      ox = W - 390 * k;
      oy = H - 150 * k;
      build();
      const count = Math.round(Math.max(22, Math.min((W * H) / 26000, 70)));
      petals = Array.from({ length: count }, () => petal(true));
    },
    recolour() {
      readColours();
      build();
    },
    frame(now, f) {
      c.fillStyle = css(bg);
      c.fillRect(0, 0, W, H);
      if (sky) {
        c.fillStyle = sky;
        c.fillRect(0, 0, W, H);
      }
      // The tree stays a background: slightly see-through so text over it reads easily.
      c.globalAlpha = light ? 0.84 : 0.82;
      if (tree) c.drawImage(tree, 0, 0, W, H);
      for (const sp of sprites) {
        const a = Math.sin(now * 0.0008 + sp.sway.phase) * sp.sway.amp;
        c.save();
        c.translate(ox + sp.sway.anchor.x * k, oy + sp.sway.anchor.y * k);
        c.rotate(a);
        c.drawImage(sp.canvas, (sp.box.x - sp.sway.anchor.x) * k, (sp.box.y - sp.sway.anchor.y) * k, sp.box.w * k, sp.box.h * k);
        c.restore();
      }
      c.globalAlpha = 1;

      // Layer 5: petals drift down and across in a breeze that rises and falls, tumbling as they go.
      const wind = -0.34 + Math.sin(now / 5200) * 0.24;
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        if (f) {
          p.y += p.fall * f;
          p.x += (wind + Math.sin(now * p.swayRate + p.phase) * p.sway) * f;
          p.rot += p.spin * f;
          p.flip += p.flipRate * f;
          if (p.y > H + 20 || p.x < -40 || p.x > W + 40) petals[i] = petal(false);
        }
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.scale(0.3 + Math.abs(Math.cos(p.flip)) * 0.7, 1);
        c.globalAlpha = p.alpha;
        c.fillStyle = p.colour;
        petalPath(c, p.size);
        c.fill();
        c.restore();
      }
      c.globalAlpha = 1;
    },
  };
}

/** The Sakura theme's background. Reduced motion and touch screens get one still frame. */
export function SakuraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCanvasScene(canvasRef, createSakura);
  return <canvas ref={canvasRef} className="pixel-grid" aria-hidden="true" />;
}
