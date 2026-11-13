"use client";

import { useRef } from "react";
import { css, isLight, pick, rand, tokenRgb, useCanvasScene, type Rgb, type Scene } from "./canvas-scene";

const COLUMN = 18;
const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
const GIT_WORDS = ["git push", "git commit", "git pull", "git merge", "git add .", "git clone", "git status", "git log", "HEAD", "main"];
/**
 * How far a column's head falls each frame, in cells. About half the old speed (0.7 cells a
 * frame on average), so the rain stays calm behind lesson text.
 */
const SPEED: [number, number] = [0.26, 0.46];

type Column = { y: number; speed: number; len: number; cell: number; trail: string[]; word: string; idx: number };

const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

function readColours(c: CanvasRenderingContext2D) {
  const bg = tokenRgb(c, "--bg-base", [4, 8, 5]);
  const primary = tokenRgb(c, "--accent-primary", [34, 197, 94]);
  const text = tokenRgb(c, "--accent-text", [74, 222, 128]);
  const light = isLight(bg);
  const pale = primary.map((v) => Math.round(v + (255 - v) * 0.65)) as Rgb;
  return {
    light,
    bg: css(bg),
    head: light ? css(text) : css(pale),
    trail: light ? css(text) : css(primary),
    glow: light ? "transparent" : css(primary),
  };
}

/**
 * Katakana and Git commands falling down the screen. Each column snaps from cell to cell like
 * the classic effect and draws its own fading trail, so nothing smears or leaves ghosts.
 */
function createMatrixRain(c: CanvasRenderingContext2D): Scene {
  // Canvas fonts cannot read CSS variables, so resolve the next/font family name once.
  const font = `15px ${getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains").trim() || "ui-monospace"}, monospace`;
  let W = 0;
  let H = 0;
  let columns: Column[] = [];
  let colours = readColours(c);

  function column(y: number, filled: boolean): Column {
    const len = Math.floor(rand(8, 20));
    const cell = Math.floor(y / COLUMN);
    return {
      y,
      speed: rand(SPEED[0], SPEED[1]) * COLUMN,
      len,
      cell,
      trail: filled ? Array.from({ length: len }, glyph) : [],
      word: Math.random() < 0.18 ? pick(GIT_WORDS) : "",
      idx: 0,
    };
  }

  function next(col: Column) {
    if (!col.word) return glyph();
    const g = col.word[col.idx] ?? " ";
    col.idx++;
    if (col.idx >= col.word.length) col.word = "";
    return g;
  }

  return {
    resize(width, height) {
      W = width;
      H = height;
      // Spread over the screen at the start, so the page never opens on an empty sky.
      columns = Array.from({ length: Math.ceil(W / COLUMN) }, () => column(rand(-H * 0.4, H * 1.1), true));
    },
    recolour() {
      colours = readColours(c);
    },
    frame(_now, f) {
      c.fillStyle = colours.bg;
      c.fillRect(0, 0, W, H);
      c.font = font;
      c.textAlign = "center";
      columns.forEach((col, i) => {
        col.y += col.speed * f;
        const cell = Math.floor(col.y / COLUMN);
        while (col.cell < cell) {
          col.cell++;
          col.trail.unshift(next(col));
          if (col.trail.length > col.len) col.trail.pop();
        }
        // Now and then a glyph in the trail changes, like the original.
        if (f && col.trail.length > 2 && Math.random() < 0.03 * f) col.trail[1 + Math.floor(Math.random() * (col.trail.length - 1))] = glyph();

        const x = i * COLUMN + COLUMN / 2;
        c.fillStyle = colours.trail;
        for (let k = col.trail.length - 1; k >= 1; k--) {
          const y = (col.cell - k) * COLUMN;
          if (y < -COLUMN || y > H + COLUMN) continue;
          c.globalAlpha = Math.pow(1 - k / col.len, 1.3) * 0.75;
          c.fillText(col.trail[k], x, y);
        }
        c.globalAlpha = 1;
        if (col.trail.length) {
          c.fillStyle = colours.head;
          c.shadowColor = colours.glow;
          c.shadowBlur = colours.light ? 0 : 7;
          c.fillText(col.trail[0], x, col.cell * COLUMN);
          c.shadowBlur = 0;
        }
        // The whole trail has left the screen: start again above it.
        if ((col.cell - col.trail.length) * COLUMN > H) columns[i] = column(rand(-220, -20), false);
      });
    },
  };
}

/**
 * The "Code Theme" background: katakana and Git commands raining down a canvas, tinted with
 * the active palette's accent (green with Matrix Green). Reduced motion and touch screens get
 * one still frame instead.
 */
export function MatrixRainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCanvasScene(canvasRef, createMatrixRain);
  return <canvas ref={canvasRef} className="pixel-grid" aria-hidden="true" />;
}
