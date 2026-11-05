"use client";

import { useEffect, useRef } from "react";

const REST = 32;
const PAD = 6;
const TARGETS = "a, button, input, select, textarea, summary, [data-frame]";

/**
 * Dot plus four trailing corner brackets that frame hovered or keyboard-focused elements.
 * Does nothing on touch devices. Add data-tone="light" to light surfaces to flip its color.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const dot = dotRef.current;
    const frame = frameRef.current;
    if (!dot || !frame) return;

    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    root.classList.add("has-cursor");

    let px = 0;
    let py = 0;
    let seen = false;
    let hovered: Element | null = null;
    let focused: Element | null = null;
    let cur = { x: 0, y: 0, w: REST, h: REST };
    let raf = 0;

    function target() {
      const el = hovered || focused;
      if (el && el.isConnected) {
        const r = el.getBoundingClientRect();
        return { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
      }
      return { x: px - REST / 2, y: py - REST / 2, w: REST, h: REST };
    }

    function tick() {
      const t = target();
      const k = reduce.matches ? 1 : 0.22;
      cur.x += (t.x - cur.x) * k;
      cur.y += (t.y - cur.y) * k;
      cur.w += (t.w - cur.w) * k;
      cur.h += (t.h - cur.h) * k;
      frame!.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
      frame!.style.width = `${cur.w}px`;
      frame!.style.height = `${cur.h}px`;
      dot!.style.transform = `translate(${px}px, ${py}px)`;
      const gap =
        Math.abs(t.x - cur.x) + Math.abs(t.y - cur.y) + Math.abs(t.w - cur.w) + Math.abs(t.h - cur.h);
      raf = gap < 0.3 && !hovered ? 0 : requestAnimationFrame(tick);
    }

    function kick() {
      if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      const el = e.target instanceof Element ? e.target : null;
      if (!seen) {
        cur = { ...cur, x: e.clientX - REST / 2, y: e.clientY - REST / 2 };
        seen = true;
      }
      px = e.clientX;
      py = e.clientY;
      hovered = el?.closest(TARGETS) ?? null;
      root.classList.toggle("cc-light", !!el?.closest('[data-tone="light"]'));
      root.classList.add("cc-on");
      kick();
    }
    function onLeave() {
      root.classList.remove("cc-on");
    }
    function onEnter() {
      if (seen) root.classList.add("cc-on");
    }
    function onFocusIn(e: FocusEvent) {
      const el = e.target;
      if (!(el instanceof Element) || !el.matches(":focus-visible")) return;
      focused = el;
      root.classList.add("cc-on");
      root.classList.toggle("cc-light", !!el.closest('[data-tone="light"]'));
      if (!seen) {
        const r = el.getBoundingClientRect();
        cur = { x: r.left, y: r.top, w: r.width, h: r.height };
      }
      kick();
    }
    function onFocusOut() {
      focused = null;
      kick();
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor", "cc-on", "cc-light");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cc-dot" aria-hidden="true" />
      <div ref={frameRef} className="cc-frame" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
    </>
  );
}
