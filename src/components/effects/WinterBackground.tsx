"use client";

import { useRef } from "react";
import { css, isLight, rand, seeded, tokenRgb, useCanvasScene, type Rgb, type Scene } from "./canvas-scene";

const BULBS = ["#fde68a", "#fca5a5", "#86efac", "#93c5fd", "#fbbf24", "#f9a8d4"];
const ORNAMENTS = ["#ef4444", "#fbbf24", "#38bdf8", "#f472b6", "#a78bfa"];
const SCARVES = ["#ef4444", "#38bdf8", "#fbbf24"];

type Flake = { x: number; y: number; r: number; fall: number; sway: number; swayRate: number; phase: number; alpha: number; rot: number; spin: number };
type Bulb = { x: number; y: number; colour: string; phase: number };
type Penguin = { x: number; dir: 1 | -1; scale: number; mode: "walk" | "slide" | "rise"; step: number; speed: number; timer: number; lie: number; scarf: string };
type Spray = { x: number; y: number; vx: number; vy: number; life: number };

/** Three snow layers: far (small, slow, faint), middle, and near (big crystals, soft focus). */
const LAYERS = [
  { per: 16000, max: 90, r: [0.8, 1.5], fall: [0.22, 0.42], alpha: [0.25, 0.45] },
  { per: 30000, max: 50, r: [1.6, 2.6], fall: [0.45, 0.8], alpha: [0.45, 0.7] },
  { per: 90000, max: 16, r: [3.4, 5.2], fall: [0.85, 1.3], alpha: [0.6, 0.85] },
] as const;

/** The rolling snow line: a few pixels of gentle hills. */
const wave = (x: number) => Math.sin(x / 170) * 6 + Math.sin(x / 63 + 1) * 3;

function starPath(c: CanvasRenderingContext2D, x: number, y: number, outer: number) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : outer * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
}

/** A penguin in profile facing +x, drawn around its body's centre. lie 0 stands, 1 lies on its belly. */
function drawPenguin(c: CanvasRenderingContext2D, p: Penguin, ground: number) {
  const walking = p.mode === "walk";
  const rock = walking ? Math.sin(p.step) * 0.13 : 0;
  const bob = walking ? Math.abs(Math.sin(p.step)) * 1.6 : 0;
  c.save();
  c.translate(p.x, ground - (16 * (1 - p.lie) + 11 * p.lie) * p.scale - bob);
  c.scale(p.dir * p.scale, p.scale);
  c.rotate(rock + (p.lie * Math.PI) / 2);
  // Feet, stepping in turn while it waddles.
  c.fillStyle = "#f59e0b";
  const lift = walking ? Math.sin(p.step) * 1.8 : 0;
  c.beginPath();
  c.ellipse(-4, 15.5 - Math.max(0, lift), 4.6, 2, 0, 0, Math.PI * 2);
  c.ellipse(5, 15.5 - Math.max(0, -lift), 4.6, 2, 0, 0, Math.PI * 2);
  c.fill();
  // Body and white belly.
  c.fillStyle = "#1f2937";
  c.beginPath();
  c.ellipse(0, 0, 11, 16, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#f8fafc";
  c.beginPath();
  c.ellipse(3.2, 2, 7.4, 12.2, 0, 0, Math.PI * 2);
  c.fill();
  // Flipper: swings while walking, tucks back while sliding.
  c.save();
  c.translate(-3.5, -3);
  c.rotate(0.25 + (walking ? Math.sin(p.step) * 0.25 : -0.9 * p.lie));
  c.fillStyle = "#111827";
  c.beginPath();
  c.ellipse(0, 6, 3.2, 8.2, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Head, face, eye, rosy cheek and beak.
  c.fillStyle = "#1f2937";
  c.beginPath();
  c.arc(2, -15, 8.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#f8fafc";
  c.beginPath();
  c.ellipse(5.2, -14, 4.8, 4.6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#0f172a";
  c.beginPath();
  c.arc(6.2, -16, 1.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(6.7, -16.6, 0.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(244, 114, 182, 0.6)";
  c.beginPath();
  c.arc(7.6, -12.4, 1.6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#f59e0b";
  c.beginPath();
  c.moveTo(9.6, -15.2);
  c.lineTo(15.4, -13.6);
  c.lineTo(9.6, -12);
  c.closePath();
  c.fill();
  // A festive scarf.
  c.fillStyle = p.scarf;
  c.beginPath();
  c.ellipse(1.5, -7.2, 9.4, 2.4, 0.05, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(-6, -7);
  c.lineTo(-10, 1);
  c.lineTo(-6.5, 1.5);
  c.lineTo(-3.5, -6);
  c.closePath();
  c.fill();
  c.restore();
}

/**
 * The Winter theme: layered snowfall over a snowy ground, a Christmas tree with twinkling
 * fairy lights and a shining star, and penguins that waddle along and belly-slide.
 */
function createWinter(c: CanvasRenderingContext2D): Scene {
  let W = 0;
  let H = 0;
  let scale = 1;
  let ground = 0;
  let still: HTMLCanvasElement | null = null;
  let flakes: Flake[][] = [];
  let bulbs: Bulb[] = [];
  let star = { x: 0, y: 0, r: 10 };
  let penguins: Penguin[] = [];
  let spray: Spray[] = [];
  let bg: Rgb = [6, 13, 26];
  let light = false;

  function readColours() {
    bg = tokenRgb(c, "--bg-base", [6, 13, 26]);
    light = isLight(bg);
  }
  readColours();

  /** Sky, stars, ground and the tree (without its lights) on their own canvas, drawn once per size. */
  function drawStill() {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const t = canvas.getContext("2d");
    if (!t) return null;
    t.setTransform(scale, 0, 0, scale, 0, 0);
    const random = seeded(1225);
    const r = (a: number, b: number) => a + random() * (b - a);

    const sky = t.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, css(bg));
    const deep = light ? bg : (bg.map((v, i) => Math.round(v + ([30, 58, 95][i] - v) * 0.35)) as Rgb);
    sky.addColorStop(1, css(deep));
    t.fillStyle = sky;
    t.fillRect(0, 0, W, H);
    if (!light) {
      for (let i = 0; i < 70; i++) {
        t.fillStyle = `rgba(224, 242, 254, ${r(0.15, 0.55)})`;
        t.fillRect(r(0, W), r(0, H * 0.6), 1.3, 1.3);
      }
    }

    // The tree stands on the snow near the right edge.
    const small = W < 700;
    const TH = Math.max(130, Math.min(H * 0.36, 320)) * (small ? 0.72 : 1);
    const TW = TH * 0.64;
    const cx = W - Math.max(70, Math.min(W * 0.13, 210)) * (small ? 0.8 : 1);
    const base = ground + wave(cx) + 4;
    const trunkH = TH * 0.1;
    t.fillStyle = "#5b3a1e";
    t.fillRect(cx - TW * 0.07, base - trunkH - 4, TW * 0.14, trunkH + 4);

    bulbs = [];
    for (let k = 0; k < 4; k++) {
      const bottom = base - trunkH - k * TH * 0.19;
      const height = TH * (0.36 - k * 0.04);
      const top = bottom - height;
      const half = (TW / 2) * (1 - k * 0.2);
      const leaf = t.createLinearGradient(cx - half, 0, cx + half, 0);
      leaf.addColorStop(0, "#0b3d24");
      leaf.addColorStop(1, "#166534");
      t.fillStyle = leaf;
      t.beginPath();
      t.moveTo(cx, top);
      t.lineTo(cx + half, bottom);
      t.lineTo(cx - half, bottom);
      t.closePath();
      t.fill();
      // Snow along the bottom edge of each tier.
      t.fillStyle = "rgba(241, 245, 249, 0.9)";
      const bumps = 7;
      for (let i = 0; i < bumps; i++) {
        const x = cx - half + ((i + 0.5) / bumps) * half * 2;
        t.beginPath();
        t.arc(x, bottom - 1, (half / bumps) * 1.05, Math.PI, 0);
        t.fill();
      }
      // A string of fairy lights sagging across the tier, and a few baubles.
      const at = (h: number, side: number) => ({ x: cx + side * half * (1 - h) * 0.86, y: bottom - h * height });
      const from = at(0.18, -1);
      const to = at(0.52, 1);
      t.strokeStyle = "rgba(15, 23, 42, 0.7)";
      t.lineWidth = 1;
      t.beginPath();
      const n = 7 - k;
      for (let i = 0; i <= 20; i++) {
        const s = i / 20;
        const x = from.x + (to.x - from.x) * s;
        const y = from.y + (to.y - from.y) * s + Math.sin(Math.PI * s) * height * 0.12;
        if (i === 0) t.moveTo(x, y);
        else t.lineTo(x, y);
      }
      t.stroke();
      for (let i = 0; i < n; i++) {
        const s = (i + 0.5) / n;
        bulbs.push({
          x: from.x + (to.x - from.x) * s,
          y: from.y + (to.y - from.y) * s + Math.sin(Math.PI * s) * height * 0.12 + 2,
          colour: BULBS[(i + k * 2) % BULBS.length],
          phase: r(0, Math.PI * 2),
        });
      }
      for (let i = 0; i < 3; i++) {
        const h = r(0.12, 0.6);
        const x = cx + r(-0.7, 0.7) * half * (1 - h);
        const y = bottom - h * height + 6;
        t.fillStyle = ORNAMENTS[Math.floor(random() * ORNAMENTS.length)];
        t.beginPath();
        t.arc(x, y, Math.max(2.6, TH * 0.017), 0, Math.PI * 2);
        t.fill();
        t.fillStyle = "rgba(255, 255, 255, 0.7)";
        t.beginPath();
        t.arc(x - 1.2, y - 1.2, 1, 0, Math.PI * 2);
        t.fill();
      }
      if (k === 3) star = { x: cx, y: top - 2, r: Math.max(8, TH * 0.045) };
    }

    // The snowy ground across the bottom, over the foot of the tree. On dark palettes it is
    // moonlit, muted snow with a bright rim, so page text scrolling over it stays readable.
    const snow = t.createLinearGradient(0, ground - 10, 0, H);
    snow.addColorStop(0, light ? "#f1f5f9" : "rgba(214, 228, 245, 0.4)");
    snow.addColorStop(1, light ? "#e2e8f0" : "rgba(160, 186, 220, 0.2)");
    t.fillStyle = snow;
    t.beginPath();
    t.moveTo(0, H);
    for (let x = 0; x <= W + 10; x += 10) t.lineTo(x, ground + wave(x));
    t.lineTo(W, H);
    t.closePath();
    t.fill();
    t.strokeStyle = light ? "rgba(148, 163, 184, 0.6)" : "rgba(236, 244, 255, 0.75)";
    t.lineWidth = 2.5;
    t.beginPath();
    for (let x = 0; x <= W + 10; x += 10) {
      if (x === 0) t.moveTo(x, ground + wave(x));
      else t.lineTo(x, ground + wave(x));
    }
    t.stroke();
    for (let i = 0; i < 40; i++) {
      t.fillStyle = `rgba(255, 255, 255, ${r(0.3, 0.8)})`;
      const x = r(0, W);
      t.fillRect(x, ground + wave(x) + r(4, H - ground), 1.4, 1.4);
    }
    return canvas;
  }

  function flake(layer: number, anywhere: boolean): Flake {
    const L = LAYERS[layer];
    return {
      x: rand(0, W),
      y: anywhere ? rand(0, H) : rand(-30, -5),
      r: rand(L.r[0], L.r[1]),
      fall: rand(L.fall[0], L.fall[1]),
      sway: rand(0.15, 0.55),
      swayRate: rand(0.0006, 0.0016),
      phase: rand(0, Math.PI * 2),
      alpha: rand(L.alpha[0], L.alpha[1]),
      rot: rand(0, Math.PI),
      spin: rand(-0.01, 0.01),
    };
  }

  function drawFlakes(layer: number, now: number, f: number) {
    const near = layer === 2;
    const ink = light ? "100, 116, 139" : "240, 249, 255";
    if (near) {
      c.lineCap = "round";
      c.shadowColor = light ? "transparent" : "rgba(186, 230, 253, 0.9)";
      c.shadowBlur = 4;
    }
    for (let i = 0; i < flakes[layer].length; i++) {
      const p = flakes[layer][i];
      if (f) {
        p.y += p.fall * f;
        p.x += Math.sin(now * p.swayRate + p.phase) * p.sway * f;
        p.rot += p.spin * f;
        if (p.y > H + 10) flakes[layer][i] = flake(layer, false);
      }
      if (near) {
        // A six-armed crystal with a little V on each arm.
        c.strokeStyle = `rgba(${ink}, ${p.alpha})`;
        c.lineWidth = 1.1;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.beginPath();
        for (let a = 0; a < 6; a++) {
          const ang = (a * Math.PI) / 3;
          const ux = Math.cos(ang);
          const uy = Math.sin(ang);
          c.moveTo(0, 0);
          c.lineTo(ux * p.r * 2, uy * p.r * 2);
          const mx = ux * p.r * 1.25;
          const my = uy * p.r * 1.25;
          c.moveTo(mx + Math.cos(ang + 0.7) * p.r * 0.6, my + Math.sin(ang + 0.7) * p.r * 0.6);
          c.lineTo(mx, my);
          c.lineTo(mx + Math.cos(ang - 0.7) * p.r * 0.6, my + Math.sin(ang - 0.7) * p.r * 0.6);
        }
        c.stroke();
        c.restore();
      } else {
        c.fillStyle = `rgba(${ink}, ${p.alpha})`;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.shadowBlur = 0;
  }

  function movePenguin(p: Penguin, f: number) {
    if (p.mode === "walk") {
      p.x += p.dir * 0.45 * f;
      p.step += 0.16 * f;
      p.timer -= f;
      if (p.timer <= 0) {
        p.mode = "slide";
        p.speed = rand(2.2, 3);
      }
    } else if (p.mode === "slide") {
      p.lie = Math.min(1, p.lie + 0.08 * f);
      p.x += p.dir * p.speed * f;
      p.speed *= Math.pow(0.993, f);
      if (p.lie === 1 && Math.random() < 0.5 * f) {
        spray.push({ x: p.x - p.dir * 14 * p.scale, y: ground + wave(p.x) - 3, vx: -p.dir * rand(0.3, 1.2), vy: rand(-1.4, -0.4), life: 1 });
      }
      if (p.speed < 0.9) p.mode = "rise";
    } else {
      p.lie = Math.max(0, p.lie - 0.05 * f);
      p.x += p.dir * 0.3 * f;
      if (p.lie === 0) {
        p.mode = "walk";
        p.timer = rand(240, 560);
      }
    }
    if (p.dir > 0 && p.x > W + 40) p.x = -40;
    if (p.dir < 0 && p.x < -40) p.x = W + 40;
  }

  return {
    resize(width, height, dpr) {
      W = width;
      H = height;
      scale = dpr;
      ground = H - Math.max(48, Math.min(H * 0.085, 86));
      still = drawStill();
      const area = W * H;
      flakes = LAYERS.map((L, i) => Array.from({ length: Math.round(Math.min(area / L.per, L.max)) }, () => flake(i, true)));
      const count = W < 700 ? 1 : 3;
      penguins = Array.from({ length: count }, (_, i) => ({
        x: ((i + 0.3) / count) * W * 0.8,
        dir: (i % 2 === 0 ? 1 : -1) as 1 | -1,
        scale: W < 700 ? 0.85 : rand(0.95, 1.15),
        mode: "walk" as const,
        step: rand(0, Math.PI * 2),
        speed: 0,
        timer: rand(60, 320),
        lie: 0,
        scarf: SCARVES[i % SCARVES.length],
      }));
      spray = [];
    },
    recolour() {
      readColours();
      still = drawStill();
    },
    frame(now, f) {
      if (still) c.drawImage(still, 0, 0, W, H);
      else {
        c.fillStyle = css(bg);
        c.fillRect(0, 0, W, H);
      }
      drawFlakes(0, now, f);

      // Fairy lights twinkle at their own pace, and the star gently pulses.
      for (const b of bulbs) {
        c.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * 0.004 + b.phase));
        c.fillStyle = b.colour;
        c.shadowColor = b.colour;
        c.shadowBlur = 9;
        c.beginPath();
        c.arc(b.x, b.y, 2.4, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      c.shadowColor = "#fde047";
      c.shadowBlur = 14 + Math.sin(now * 0.003) * 6;
      c.fillStyle = "#fde047";
      starPath(c, star.x, star.y, star.r);
      c.fill();
      c.shadowBlur = 0;

      for (const p of penguins) {
        if (f) movePenguin(p, f);
        drawPenguin(c, p, ground + wave(p.x));
      }
      spray = spray.filter((s) => s.life > 0);
      for (const s of spray) {
        if (f) {
          s.x += s.vx * f;
          s.y += s.vy * f;
          s.vy += 0.08 * f;
          s.life -= 0.03 * f;
        }
        c.fillStyle = `rgba(255, 255, 255, ${Math.max(0, s.life) * 0.9})`;
        c.fillRect(s.x, s.y, 2, 2);
      }

      drawFlakes(1, now, f);
      drawFlakes(2, now, f);
    },
  };
}

/** The Winter theme's background. Reduced motion and touch screens get one still frame. */
export function WinterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCanvasScene(canvasRef, createWinter);
  return <canvas ref={canvasRef} className="pixel-grid" aria-hidden="true" />;
}

