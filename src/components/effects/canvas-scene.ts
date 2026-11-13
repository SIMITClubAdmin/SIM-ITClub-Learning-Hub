"use client";

import { useEffect, type RefObject } from "react";

/** Shared plumbing for the animated theme backgrounds (matrix rain, sakura, winter). */

export type Rgb = [number, number, number];

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const css = (c: Rgb, alpha = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
export const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/** A small seeded random generator, so a tree or scene keeps its shape between resizes. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Reads a theme token from <html> as RGB, whatever colour syntax it was written in. */
export function tokenRgb(probe: CanvasRenderingContext2D, name: string, fallback: Rgb): Rgb {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) return fallback;
  probe.fillStyle = "#010203";
  probe.fillStyle = value;
  const out = String(probe.fillStyle);
  if (out === "#010203") return fallback;
  if (out.startsWith("#")) return [1, 3, 5].map((i) => parseInt(out.slice(i, i + 2), 16)) as Rgb;
  const n = out.match(/[\d.]+/g);
  return n && n.length >= 3 ? [Number(n[0]), Number(n[1]), Number(n[2])] : fallback;
}

export const isLight = (c: Rgb) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 > 0.5;

export type Scene = {
  /** The canvas changed size (CSS pixels): rebuild anything cached at that size. */
  resize(width: number, height: number, dpr: number): void;
  /** Draws one frame. f is how many 60fps frames have passed (0 redraws without moving). */
  frame(now: number, f: number): void;
  /** The site palette changed: re-read the colour tokens. */
  recolour(): void;
};

const FPS = 60;

/**
 * Runs a full-window canvas scene at up to 60fps. It pauses in background tabs, draws a
 * single still frame for reduced motion and touch screens, and recolours when the palette changes.
 * create must be a stable (module-level) function.
 */
export function useCanvasScene(ref: RefObject<HTMLCanvasElement | null>, create: (c: CanvasRenderingContext2D) => Scene) {
  useEffect(() => {
    const canvas = ref.current;
    const c = canvas?.getContext("2d");
    if (!canvas || !c) return;
    const scene = create(c);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const touch = matchMedia("(hover: none), (pointer: coarse)");
    let raf = 0;
    let last = 0;
    let animated = false;

    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      if (last && now - last < 1000 / FPS - 1) return;
      const f = last ? Math.min((now - last) / (1000 / 60), 3) : 1;
      last = now;
      scene.frame(now, f);
    }
    function start() {
      if (animated && !raf && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = window.innerWidth;
      const H = window.innerHeight;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      c!.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize(W, H, dpr);
      scene.frame(performance.now(), 0);
    }
    function applyMode() {
      animated = !reduce.matches && !touch.matches;
      if (animated) start();
      else {
        stop();
        scene.frame(performance.now(), 0);
      }
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    const paletteWatch = new MutationObserver(() => {
      scene.recolour();
      scene.frame(performance.now(), 0);
    });
    paletteWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette"] });

    resize();
    applyMode();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", applyMode);
    touch.addEventListener("change", applyMode);
    return () => {
      stop();
      paletteWatch.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", applyMode);
      touch.removeEventListener("change", applyMode);
    };
  }, [ref, create]);
}
