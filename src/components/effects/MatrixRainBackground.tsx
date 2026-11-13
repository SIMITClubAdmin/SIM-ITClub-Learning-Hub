"use client";

import { useEffect, useRef } from "react";

const FPS = 60;
const COLUMN = 18;
const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
const GIT_WORDS = ["git push", "git commit", "git pull", "git merge", "git add .", "git clone", "git status", "git log", "HEAD", "main"];

type Rgb = [number, number, number];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const css = (c: Rgb, alpha = 1) => `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;

/** Reads a theme token from <html> as RGB, whatever colour syntax it was written in. */
function tokenRgb(probe: CanvasRenderingContext2D, name: string, fallback: Rgb): Rgb {
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

/**
 * The "Code Theme" background: katakana and Git commands raining down a canvas, tinted with
 * the active palette's accent (green with Matrix Green). Reduced motion and touch screens get
 * one still frame instead.
 */
export function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const c = ctx;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const touch = matchMedia("(hover: none), (pointer: coarse)");
    // Canvas fonts cannot read CSS variables, so resolve the next/font family name once.
    const mono = `${getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains").trim() || "ui-monospace"}, monospace`;
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = 0;
    let tick = 0;
    let animated = false;
    let columns: { y: number; speed: number; word: string; idx: number }[] = [];
    let colours = readColours();

    function readColours() {
      const bg = tokenRgb(c, "--bg-base", [4, 8, 5]);
      const primary = tokenRgb(c, "--accent-primary", [34, 197, 94]);
      const text = tokenRgb(c, "--accent-text", [74, 222, 128]);
      const light = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255 > 0.5;
      const pale = primary.map((v) => Math.round(v + (255 - v) * 0.65)) as Rgb;
      return {
        light,
        bg: css(bg),
        // A translucent wash each frame leaves the trail behind every head glyph.
        wash: css(bg, light ? 0.16 : 0.14),
        head: light ? css(text) : css(pale),
        trail: (alpha: number) => (light ? css(text, alpha * 0.75) : css(primary, alpha * 0.85)),
        glow: light ? "transparent" : css(primary),
      };
    }

    function setup() {
      columns = Array.from({ length: Math.ceil(W / COLUMN) }, () => ({ y: rand(-H, 0), speed: rand(5, 13), word: "", idx: 0 }));
    }

    function drawFrame(first: boolean) {
      c.fillStyle = first ? colours.bg : colours.wash;
      c.fillRect(0, 0, W, H);
      c.font = `15px ${mono}`;
      c.textAlign = "center";
      columns.forEach((col, i) => {
        const x = i * COLUMN + COLUMN / 2;
        let glyph: string;
        if (col.word) {
          glyph = col.word[col.idx] ?? " ";
          col.idx++;
          if (col.idx >= col.word.length) col.word = "";
        } else glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        c.fillStyle = colours.head;
        c.shadowColor = colours.glow;
        c.shadowBlur = colours.light ? 0 : 8;
        c.fillText(glyph, x, col.y);
        c.shadowBlur = 0;
        c.fillStyle = colours.trail(1);
        c.fillText(GLYPHS[(i * 7 + Math.floor(tick / 6)) % GLYPHS.length], x, col.y - 18);
        col.y += col.speed * 1.4;
        if (col.y > H + 20) {
          col.y = rand(-200, 0);
          col.speed = rand(5, 13);
          if (Math.random() < 0.18) {
            col.word = GIT_WORDS[Math.floor(Math.random() * GIT_WORDS.length)];
            col.idx = 0;
          }
        }
      });
    }

    /** One still frame of code trails, for reduced motion and touch screens. */
    function drawStill() {
      c.fillStyle = colours.bg;
      c.fillRect(0, 0, W, H);
      c.font = `15px ${mono}`;
      c.textAlign = "center";
      columns.forEach((_, i) => {
        const x = i * COLUMN + COLUMN / 2;
        const head = rand(0, H * 1.2);
        const length = Math.floor(rand(6, 18));
        for (let k = 0; k < length; k++) {
          const alpha = k === 0 ? 1 : 0.85 - k / length;
          if (alpha <= 0) break;
          c.fillStyle = k === 0 ? colours.head : colours.trail(alpha);
          c.fillText(GLYPHS[Math.floor(Math.random() * GLYPHS.length)], x, head - k * 18);
        }
      });
    }

    const render = (first = false) => (animated ? drawFrame(first) : drawStill());

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (now - last < 1000 / FPS - 1) return;
      last = now;
      tick++;
      drawFrame(false);
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
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      setup();
      render(true);
    }
    function applyMode() {
      animated = !reduce.matches && !touch.matches;
      if (animated) start();
      else {
        stop();
        render(true);
      }
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    // A new palette recolours the rain straight away.
    const paletteWatch = new MutationObserver(() => {
      colours = readColours();
      render(true);
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
  }, []);

  return <canvas ref={canvasRef} className="pixel-grid" aria-hidden="true" />;
}
