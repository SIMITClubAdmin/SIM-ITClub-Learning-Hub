"use client";

import { useEffect, useRef } from "react";
import type { WorldId } from "@/lib/appearance-config";

type World = Exclude<WorldId, "pixel">;

const FPS = 45;
/** Keep busy sprites out of the header band, where they would sit behind the nav links. */
const HEADER_CLEARANCE = 110;
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

type Sprite = {
  glyph: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rot: number;
  vr: number;
  phase: number;
  kind: "float" | "walk" | "slide" | "peek" | "trail" | "bob";
  life?: number;
  flip?: boolean;
};

/** Emoji drawn once into a small canvas, then stamped with drawImage every frame. */
function makeEmojiCache() {
  const cache = new Map<string, HTMLCanvasElement>();
  return (glyph: string, size: number) => {
    const key = `${glyph}@${size}`;
    let c = cache.get(key);
    if (!c) {
      c = document.createElement("canvas");
      const pad = Math.ceil(size * 0.3);
      c.width = c.height = size + pad * 2;
      const ctx = c.getContext("2d")!;
      ctx.font = `${size}px ${EMOJI_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyph, c.width / 2, c.height / 2 + size * 0.06);
      cache.set(key, c);
    }
    return c;
  };
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

const MATRIX_GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
const GIT_WORDS = ["git push", "git commit", "git pull", "git merge", "git add .", "git clone", "git status", "git log", "HEAD", "main"];

/** Animated backgrounds for the Appearance "theme worlds". Pixel grid is its own component. */
export function ThemeWorldBackground({ world }: { world: World }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const c = ctx;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const touch = matchMedia("(hover: none), (pointer: coarse)");
    const emoji = makeEmojiCache();
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = 0;
    let t = 0;
    let sprites: Sprite[] = [];
    let animated = false;
    let snow: { x: number; y: number; r: number; v: number; sway: number }[] = [];
    let columns: { y: number; speed: number; word: string; idx: number }[] = [];
    const MATRIX_COL = 18;

    const css = () => getComputedStyle(document.documentElement);
    const light = () => document.documentElement.dataset.palette === "purple-light";
    let bg = "#070b1f";
    // Canvas fonts cannot read CSS variables, so resolve the next/font family name once.
    const mono = `${css().getPropertyValue("--font-jetbrains").trim() || "ui-monospace"}, monospace`;

    function floaters(glyphs: readonly string[], count: number, min: number, max: number, alpha: [number, number]) {
      for (let i = 0; i < count; i++) {
        sprites.push({
          glyph: pick(glyphs),
          x: rand(0, W),
          y: rand(HEADER_CLEARANCE, H),
          vx: rand(-0.25, 0.25),
          vy: rand(-0.35, -0.08),
          size: Math.round(rand(min, max)),
          alpha: rand(alpha[0], alpha[1]),
          rot: rand(-0.4, 0.4),
          vr: rand(-0.004, 0.004),
          phase: rand(0, Math.PI * 2),
          kind: "float",
        });
      }
    }

    function walker(glyph: string, speed: number, size: number, kind: Sprite["kind"] = "walk") {
      const fromLeft = Math.random() > 0.5;
      sprites.push({
        glyph,
        x: fromLeft ? -60 : W + 60,
        y: H - size * 0.55 - 6,
        vx: (fromLeft ? 1 : -1) * speed,
        vy: 0,
        size,
        alpha: 0.85,
        rot: kind === "slide" ? (fromLeft ? -1.35 : 1.35) : 0,
        vr: 0,
        phase: rand(0, Math.PI * 2),
        kind,
        flip: !fromLeft,
      });
    }

    function setup() {
      sprites = [];
      snow = [];
      columns = [];
      bg = css().getPropertyValue("--color-bg").trim() || "#070b1f";
      if (world === "cat") {
        floaters(["🧶", "🐟", "🐾", "🧶", "🐾", "🐱"], Math.round(W / 95), 28, 48, [0.5, 0.8]);
        for (let i = 0; i < 2; i++) walker(pick(["🐈", "🐈‍⬛"]), rand(0.6, 1.1), 52);
      } else if (world === "dog") {
        floaters(["🦴", "🎾", "🐾", "🦴", "🎾", "🐶"], Math.round(W / 95), 28, 48, [0.5, 0.8]);
        for (let i = 0; i < 2; i++) walker(pick(["🐕", "🐕‍🦺", "🐩"]), rand(0.9, 1.6), 52);
      } else if (world === "penguin") {
        const flakes = Math.round((W * H) / 9000);
        for (let i = 0; i < flakes; i++) snow.push({ x: rand(0, W), y: rand(0, H), r: rand(0.8, 2.6), v: rand(0.3, 1.1), sway: rand(0, Math.PI * 2) });
        floaters(["🧊", "❄️"], Math.round(W / 180), 24, 40, [0.45, 0.7]);
        walker("🐧", 0.7, 50);
        walker("🐧", 0.55, 42);
        walker("🐧", 2.4, 46, "slide");
      } else if (world === "kawaii") {
        floaters(["⭐", "✨", "☁️", "🍮", "🍡", "🌸", "☁️"], Math.round(W / 85), 28, 50, [0.55, 0.85]);
        for (let i = 0; i < Math.max(3, Math.round(W / 420)); i++) {
          sprites.push({ glyph: "blob", x: rand(40, W - 40), y: rand(HEADER_CLEARANCE + 40, H - 40), vx: rand(-0.15, 0.15), vy: 0, size: rand(40, 58), alpha: 0.9, rot: 0, vr: 0, phase: rand(0, 6), kind: "bob" });
        }
      } else {
        const count = Math.ceil(W / MATRIX_COL);
        for (let i = 0; i < count; i++) columns.push({ y: rand(-H, 0), speed: rand(5, 13), word: "", idx: 0 });
      }
    }

    /** A round, original kawaii doodle: white body, dot eyes, pink cheeks. */
    function drawBlob(s: Sprite) {
      const bob = Math.sin(t * 2 + s.phase) * 5;
      const x = s.x;
      const y = s.y + bob;
      const r = s.size / 2;
      c.save();
      c.globalAlpha = s.alpha;
      c.fillStyle = light() ? "#ffffff" : "#f8fafc";
      c.strokeStyle = "rgba(120, 90, 160, 0.55)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(x, y, r, r * 0.88, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      // ears
      c.beginPath();
      c.arc(x - r * 0.55, y - r * 0.72, r * 0.26, 0, Math.PI * 2);
      c.arc(x + r * 0.55, y - r * 0.72, r * 0.26, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#1f1630";
      c.beginPath();
      c.arc(x - r * 0.32, y - r * 0.05, r * 0.09, 0, Math.PI * 2);
      c.arc(x + r * 0.32, y - r * 0.05, r * 0.09, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "rgba(244, 114, 182, 0.6)";
      c.beginPath();
      c.ellipse(x - r * 0.52, y + r * 0.2, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
      c.ellipse(x + r * 0.52, y + r * 0.2, r * 0.16, r * 0.1, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function drawSprite(s: Sprite) {
      if (s.glyph === "blob") return drawBlob(s);
      const img = emoji(s.glyph, s.size);
      let y = s.y;
      if (s.kind === "float") y += Math.sin(t * 1.3 + s.phase) * 6;
      if (s.kind === "walk") y += Math.abs(Math.sin(t * 6 + s.phase)) * -4;
      c.save();
      c.globalAlpha = s.alpha * (s.life ?? 1);
      c.translate(s.x, y);
      const wobble = s.kind === "walk" ? Math.sin(t * 6 + s.phase) * 0.12 : 0;
      c.rotate(s.rot + wobble);
      if (s.flip) c.scale(-1, 1);
      c.drawImage(img, -img.width / 2, -img.height / 2);
      c.restore();
    }

    function drawBase() {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      const glow = (x: number, y: number, r: number, color: string) => {
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, "transparent");
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      };
      const lightMode = light();
      if (world === "cat") {
        glow(W * 0.15, H * 0.2, W * 0.45, lightMode ? "rgba(244,114,182,0.14)" : "rgba(244,114,182,0.12)");
        glow(W * 0.85, H * 0.75, W * 0.4, "rgba(168,85,247,0.1)");
      } else if (world === "dog") {
        glow(W * 0.2, H * 0.3, W * 0.45, "rgba(251,191,36,0.1)");
        glow(W * 0.8, H * 0.7, W * 0.4, "rgba(56,189,248,0.08)");
      } else if (world === "penguin") {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, lightMode ? "rgba(186,230,253,0.35)" : "rgba(14,116,144,0.18)");
        g.addColorStop(1, lightMode ? "rgba(255,255,255,0.4)" : "rgba(186,230,253,0.08)");
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      } else if (world === "kawaii") {
        glow(W * 0.2, H * 0.25, W * 0.4, "rgba(249,168,212,0.16)");
        glow(W * 0.8, H * 0.35, W * 0.4, "rgba(196,181,253,0.16)");
        glow(W * 0.5, H * 0.9, W * 0.5, "rgba(167,243,208,0.12)");
      }
    }

    /** Ice shelf and igloos along the bottom edge for the penguin world. */
    function drawIce() {
      const lightMode = light();
      c.save();
      c.fillStyle = lightMode ? "rgba(186,230,253,0.75)" : "rgba(224,242,254,0.16)";
      c.beginPath();
      c.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) c.lineTo(x, H - 22 - Math.sin(x * 0.02 + t * 0.4) * 4);
      c.lineTo(W, H);
      c.fill();
      const igloos = [0.12, 0.78];
      for (const fx of igloos) {
        const x = W * fx;
        const r = 46;
        c.fillStyle = lightMode ? "rgba(255,255,255,0.95)" : "rgba(224,242,254,0.22)";
        c.beginPath();
        c.arc(x, H - 20, r, Math.PI, 0);
        c.fill();
        c.strokeStyle = lightMode ? "rgba(14,116,144,0.35)" : "rgba(186,230,253,0.25)";
        c.lineWidth = 1;
        for (let row = 1; row < 3; row++) {
          c.beginPath();
          c.arc(x, H - 20, r - row * 14, Math.PI, 0);
          c.stroke();
        }
        c.fillStyle = lightMode ? "rgba(14,116,144,0.5)" : "rgba(7,11,31,0.6)";
        c.beginPath();
        c.arc(x + 14, H - 20, 12, Math.PI, 0);
        c.fill();
      }
      c.restore();
    }

    function drawSnow() {
      c.fillStyle = light() ? "rgba(56,189,248,0.55)" : "rgba(240,249,255,0.75)";
      for (const f of snow) {
        c.beginPath();
        c.arc(f.x + Math.sin(t + f.sway) * 6, f.y, f.r, 0, Math.PI * 2);
        c.fill();
      }
    }

    function stepSnow(dt: number) {
      for (const f of snow) {
        f.y += f.v * dt;
        if (f.y > H) {
          f.y = -4;
          f.x = rand(0, W);
        }
      }
    }

    function drawMatrixFrame(first: boolean) {
      const lightMode = light();
      // A translucent wash leaves the falling trails behind each head glyph.
      c.fillStyle = first ? bg : lightMode ? "rgba(248,247,252,0.16)" : "rgba(3,6,4,0.14)";
      c.fillRect(0, 0, W, H);
      c.font = `15px ${mono}`;
      c.textAlign = "center";
      columns.forEach((col, i) => {
        const x = i * MATRIX_COL + MATRIX_COL / 2;
        let glyph: string;
        if (col.word) {
          glyph = col.word[col.idx] ?? " ";
          col.idx++;
          if (col.idx >= col.word.length) col.word = "";
        } else glyph = MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
        c.fillStyle = lightMode ? "#166534" : "#bbf7d0";
        c.shadowColor = lightMode ? "transparent" : "#22c55e";
        c.shadowBlur = lightMode ? 0 : 8;
        c.fillText(glyph, x, col.y);
        c.shadowBlur = 0;
        c.fillStyle = lightMode ? "rgba(21,128,61,0.75)" : "rgba(34,197,94,0.85)";
        c.fillText(MATRIX_GLYPHS[(i * 7 + Math.floor(t * 10)) % MATRIX_GLYPHS.length], x, col.y - 18);
        col.y += col.speed * 1.4;
        if (col.y > H + 20) {
          col.y = rand(-200, 0);
          col.speed = rand(5, 13);
          if (Math.random() < 0.18) {
            col.word = pick(GIT_WORDS);
            col.idx = 0;
          }
        }
      });
    }

    function step(dt: number) {
      for (const s of sprites) {
        if (s.kind === "float" || s.kind === "bob") {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.rot += s.vr * dt;
          if (s.y < HEADER_CLEARANCE - 40) s.y = H + 30;
          if (s.x < -50) s.x = W + 50;
          if (s.x > W + 50) s.x = -50;
        } else if (s.kind === "walk" || s.kind === "slide") {
          s.x += s.vx * dt;
          // Leave paw prints behind walking cats and dogs.
          if ((world === "cat" || world === "dog") && Math.random() < 0.025 * dt) {
            sprites.push({ glyph: "🐾", x: s.x, y: s.y + 14, vx: 0, vy: 0, size: 22, alpha: 0.55, rot: s.vx > 0 ? 1.57 : -1.57, vr: 0, phase: 0, kind: "trail", life: 1 });
          }
          if (s.x > W + 80 || s.x < -80) {
            const fromLeft = Math.random() > 0.5;
            s.x = fromLeft ? -60 : W + 60;
            s.vx = (fromLeft ? 1 : -1) * Math.abs(s.vx);
            s.flip = !fromLeft;
            if (s.kind === "slide") s.rot = fromLeft ? -1.35 : 1.35;
          }
        } else if (s.kind === "trail") {
          s.life = (s.life ?? 1) - 0.006 * dt;
        }
      }
      sprites = sprites.filter((s) => s.kind !== "trail" || (s.life ?? 0) > 0);
    }

    /** Reduced motion or touch: one still frame of code trails instead of the falling animation. */
    function drawMatrixStill() {
      const lightMode = light();
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.font = `15px ${mono}`;
      c.textAlign = "center";
      columns.forEach((_, i) => {
        const x = i * MATRIX_COL + MATRIX_COL / 2;
        const head = rand(0, H * 1.2);
        const length = Math.floor(rand(6, 18));
        for (let k = 0; k < length; k++) {
          const alpha = k === 0 ? 1 : 0.85 - k / length;
          if (alpha <= 0) break;
          c.fillStyle = k === 0 ? (lightMode ? "#166534" : "#bbf7d0") : lightMode ? `rgba(21,128,61,${alpha * 0.7})` : `rgba(34,197,94,${alpha})`;
          c.fillText(MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)], x, head - k * 18);
        }
      });
    }

    function render(first = false) {
      if (world === "matrix") return animated ? drawMatrixFrame(first) : drawMatrixStill();
      drawBase();
      if (world === "penguin") {
        drawSnow();
        drawIce();
      }
      for (const s of sprites) drawSprite(s);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const elapsed = now - last;
      if (elapsed < 1000 / FPS) return;
      last = now;
      const dt = Math.min(elapsed, 100) / 16.67;
      t += dt / 60;
      step(dt);
      if (world === "penguin") stepSnow(dt);
      render();
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
        // Nothing walks in a still frame, so bring the walkers on screen where they can be seen.
        for (const s of sprites) if (s.kind === "walk" || s.kind === "slide") s.x = rand(80, Math.max(81, W - 80));
        render(true);
      }
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    // "Noot Noot!" when a penguin is clicked (the canvas sits behind the page, so hit-test).
    function onClick(e: MouseEvent) {
      if (world !== "penguin") return;
      const target = e.target as Element | null;
      if (target?.closest("a, button, input, textarea, select, label, [role='button'], iframe")) return;
      const hit = sprites.find((s) => s.glyph === "🐧" && Math.abs(s.x - e.clientX) < s.size * 0.7 && Math.abs(s.y - e.clientY) < s.size * 0.8);
      if (!hit) return;
      const tip = document.createElement("div");
      tip.className = "world-tooltip";
      tip.textContent = "Noot Noot!";
      tip.style.left = `${e.clientX + 12}px`;
      tip.style.top = `${e.clientY - 36}px`;
      document.body.appendChild(tip);
      setTimeout(() => tip.remove(), 1300);
    }

    const paletteWatch = new MutationObserver(() => {
      bg = css().getPropertyValue("--color-bg").trim() || bg;
      render(true);
    });
    paletteWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette"] });

    resize();
    applyMode();
    window.addEventListener("resize", resize);
    window.addEventListener("click", onClick);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", applyMode);
    touch.addEventListener("change", applyMode);
    return () => {
      stop();
      paletteWatch.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", applyMode);
      touch.removeEventListener("change", applyMode);
    };
  }, [world]);

  return <canvas ref={canvasRef} className="pixel-grid" aria-hidden="true" />;
}
