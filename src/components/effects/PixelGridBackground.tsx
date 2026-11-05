"use client";

import { useEffect, useRef } from "react";

const TILE = 28;
const FPS = 14;
const FIELD_SPEED = 0.14;
const POINTER_RADIUS = 220;
const POINTER_GLOW = 0.16;
const CLOUD_START = 0.5;
const LEVELS = 5;
const HUE_STEPS = 16;

const SPACE: [number, number, number] = [7, 11, 31];
const NEBULA: [number, number, number][] = [
  [38, 76, 214], // blue
  [109, 74, 255], // violet
  [190, 60, 170], // magenta
  [24, 150, 180], // teal
];
const STAR = "rgba(230, 241, 255, 0.75)";
const GRID_LINE = "rgba(148, 170, 255, 0.07)";

function rgb(a: [number, number, number], b: [number, number, number], t: number) {
  const m = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${m(0)}, ${m(1)}, ${m(2)})`;
}

/** Precomputed colors, indexed by hue step then brightness level. Kept dark so text stays readable. */
function buildPalette() {
  const table: string[][] = [];
  for (let h = 0; h < HUE_STEPS; h++) {
    const pos = (h / HUE_STEPS) * NEBULA.length;
    const a = NEBULA[Math.floor(pos)];
    const b = NEBULA[(Math.floor(pos) + 1) % NEBULA.length];
    const f = pos - Math.floor(pos);
    const hue: [number, number, number] = [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
    const row: string[] = [];
    for (let l = 0; l < LEVELS; l++) row.push(rgb(SPACE, hue, 0.12 + (l / (LEVELS - 1)) * 0.5));
    table.push(row);
  }
  return table;
}

function hash3(x: number, y: number, z: number) {
  let n = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  n = ((n ^ (n >>> 13)) * 1274126177) | 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function noise(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const w = smooth(z - zi);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const plane = (k: number) =>
    lerp(
      lerp(hash3(xi, yi, k), hash3(xi + 1, yi, k), u),
      lerp(hash3(xi, yi + 1, k), hash3(xi + 1, yi + 1, k), u),
      v,
    );
  return lerp(plane(zi), plane(zi + 1), w);
}

function fbm(x: number, y: number, z: number) {
  return noise(x, y, z) * 0.7 + noise(x * 2.1 + 9, y * 2.1 + 4, z * 1.4) * 0.3;
}

/** Fixed canvas of pixelated nebula clouds that drift and morph behind a thin grid. */
export function PixelGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const touch = matchMedia("(hover: none), (pointer: coarse)");
    const palette = buildPalette();

    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let raf = 0;
    let last = 0;
    let time = 40;
    let mx = -9999;
    let my = -9999;
    let glow = 0;
    let glowTarget = 0;
    let animated = false;

    function draw() {
      const c = ctx!;
      c.fillStyle = `rgb(${SPACE.join(", ")})`;
      c.fillRect(0, 0, W, H);
      const twinkle = Math.floor(time * 12);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * TILE;
          const y = j * TILE;
          let density = fbm(i * 0.12, j * 0.12, time);
          if (glow > 0.01) {
            const d = Math.hypot(x + TILE / 2 - mx, y + TILE / 2 - my);
            if (d < POINTER_RADIUS) {
              density += smooth(1 - d / POINTER_RADIUS) * POINTER_GLOW * glow;
            }
          }
          if (density > CLOUD_START) {
            const hueField = (noise(i * 0.035 + 50, j * 0.035 + 50, time * 0.6) * 1.8) % 1;
            const hue = Math.min(HUE_STEPS - 1, Math.floor(hueField * HUE_STEPS));
            const level = Math.min(LEVELS - 1, Math.floor(((density - CLOUD_START) / 0.28) * LEVELS));
            c.fillStyle = palette[hue][level];
            c.fillRect(x, y, TILE, TILE);
          }
          // A few cells hold a star that fades in and out on its own slow cycle.
          const seed = hash3(i, j, 7);
          if (seed > 0.988) {
            const on = hash3(i, j, Math.floor(twinkle / 24 + seed * 100)) > 0.35;
            if (on) {
              const size = seed > 0.996 ? 4 : 2;
              c.fillStyle = STAR;
              c.fillRect(x + TILE / 2 - size / 2, y + TILE / 2 - size / 2, size, size);
            }
          }
        }
      }
      c.fillStyle = GRID_LINE;
      for (let i = 1; i <= cols; i++) c.fillRect(i * TILE - 1, 0, 1, H);
      for (let j = 1; j <= rows; j++) c.fillRect(0, j * TILE - 1, W, 1);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const elapsed = now - last;
      if (elapsed < 1000 / FPS) return;
      last = now;
      // Clamp so returning from a hidden tab does not jump the clouds.
      time += (Math.min(elapsed, 100) / 1000) * FIELD_SPEED;
      glow += (glowTarget - glow) * 0.15;
      draw();
    }

    function start() {
      if (animated && !raf && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / TILE);
      rows = Math.ceil(H / TILE);
      draw();
    }
    function applyMode() {
      animated = !reduce.matches && !touch.matches;
      if (animated) {
        start();
      } else {
        stop();
        glow = 0;
        draw();
      }
    }
    function onMove(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      mx = e.clientX;
      my = e.clientY;
      glowTarget = 1;
    }
    function onLeave() {
      glowTarget = 0;
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    resize();
    applyMode();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", applyMode);
    touch.addEventListener("change", applyMode);

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", applyMode);
      touch.removeEventListener("change", applyMode);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-grid" aria-hidden="true" />;
}
