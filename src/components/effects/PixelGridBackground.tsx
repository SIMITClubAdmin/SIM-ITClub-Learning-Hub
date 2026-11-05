"use client";

import { useEffect, useRef } from "react";

const TILE = 12;
const AMPLITUDE = 3;
const RADIUS = 150;
const TONES = { bg: "#2c0735", lift: "#3a0f48", deep: "#26062e" };

type Rect = { x: number; y: number; w: number; h: number };

function hash(i: number, j: number) {
  let n = (i * 374761393 + j * 668265263) | 0;
  n = ((n ^ (n >>> 13)) * 1274126177) | 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function tone(i: number, j: number) {
  const h = hash(i, j);
  return h < 0.34 ? TONES.deep : h > 0.72 ? TONES.lift : TONES.bg;
}

/** Fixed canvas of tiles. Tiles near the pointer ripple; static on touch and reduced motion. */
export function PixelGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const touch = matchMedia("(hover: none), (pointer: coarse)");
    const cache = document.createElement("canvas");

    let dpr = 1;
    let W = 0;
    let H = 0;
    let cols = 0;
    let rows = 0;
    let animated = false;
    let mx = -9999;
    let my = -9999;
    let tx = -9999;
    let ty = -9999;
    let strength = 0;
    let strengthTarget = 0;
    let raf = 0;
    let lastMove = 0;
    let dirty: Rect | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const t0 = performance.now();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      cols = Math.ceil(W / TILE);
      rows = Math.ceil(H / TILE);
      cache.width = canvas!.width;
      cache.height = canvas!.height;
      const g = cache.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = TONES.bg;
      g.fillRect(0, 0, W, H);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const c = tone(i, j);
          if (c === TONES.bg) continue;
          g.fillStyle = c;
          g.fillRect(i * TILE + 1, j * TILE + 1, TILE - 1, TILE - 1);
        }
      }
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.drawImage(cache, 0, 0, W, H);
      dirty = null;
    }

    function restore(r: Rect) {
      const x = Math.max(0, r.x);
      const y = Math.max(0, r.y);
      const w = Math.min(W - x, r.w);
      const h = Math.min(H - y, r.h);
      if (w > 0 && h > 0) {
        ctx!.drawImage(cache, x * dpr, y * dpr, w * dpr, h * dpr, x, y, w, h);
      }
    }

    function frame(now: number) {
      raf = 0;
      if (!animated || document.hidden) return;
      mx += (tx - mx) * 0.12;
      my += (ty - my) * 0.12;
      strength += (strengthTarget - strength) * 0.08;
      if (Date.now() - lastMove > 1800) strengthTarget = 0;
      if (dirty) restore(dirty);

      if (strength > 0.01) {
        const time = (now - t0) / 1000;
        const m = AMPLITUDE + 2;
        const rect: Rect = {
          x: Math.floor(mx - RADIUS) - m,
          y: Math.floor(my - RADIUS) - m,
          w: RADIUS * 2 + m * 2,
          h: RADIUS * 2 + m * 2,
        };
        restore(rect);
        const i0 = Math.max(0, Math.floor(rect.x / TILE));
        const i1 = Math.min(cols - 1, Math.ceil((rect.x + rect.w) / TILE));
        const j0 = Math.max(0, Math.floor(rect.y / TILE));
        const j1 = Math.min(rows - 1, Math.ceil((rect.y + rect.h) / TILE));
        const wave: [number, number, number, number][] = [];
        for (let j = j0; j <= j1; j++) {
          for (let i = i0; i <= i1; i++) {
            const dx = i * TILE + TILE / 2 - mx;
            const dy = j * TILE + TILE / 2 - my;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > RADIUS) continue;
            let f = 1 - d / RADIUS;
            f = f * f * (3 - 2 * f);
            const disp = Math.sin(d * 0.045 - time * 1.6) * f * AMPLITUDE * strength;
            ctx!.fillStyle = TONES.bg;
            ctx!.fillRect(i * TILE, j * TILE, TILE, TILE);
            wave.push([i, j, d ? (dx / d) * disp : 0, d ? (dy / d) * disp : 0]);
          }
        }
        for (const [i, j, ox, oy] of wave) {
          ctx!.fillStyle = tone(i, j);
          ctx!.fillRect(i * TILE + 1 + ox, j * TILE + 1 + oy, TILE - 1, TILE - 1);
        }
        dirty = rect;
      } else {
        dirty = null;
        if (strengthTarget === 0) {
          ctx!.drawImage(cache, 0, 0, W, H);
          return;
        }
      }
      raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (animated && !raf && !document.hidden) raf = requestAnimationFrame(frame);
    }

    function applyMode() {
      animated = !reduce.matches && !touch.matches;
      if (!animated) {
        strength = 0;
        strengthTarget = 0;
        cancelAnimationFrame(raf);
        raf = 0;
        ctx!.drawImage(cache, 0, 0, W, H);
        dirty = null;
      }
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType === "touch" || !animated) return;
      if (mx < -1000) {
        mx = e.clientX;
        my = e.clientY;
      }
      tx = e.clientX;
      ty = e.clientY;
      strengthTarget = 1;
      lastMove = Date.now();
      kick();
    }
    function onLeave() {
      strengthTarget = 0;
      kick();
    }
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        kick();
      }
    }
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        applyMode();
      }, 120);
    }

    resize();
    applyMode();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", applyMode);
    touch.addEventListener("change", applyMode);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", applyMode);
      touch.removeEventListener("change", applyMode);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-grid" aria-hidden="true" />;
}
