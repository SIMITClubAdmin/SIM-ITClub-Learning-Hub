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
        // An element inside a same-site frame (the Event Lab): add the frame's position.
        const host = el.ownerDocument !== document ? el.ownerDocument.defaultView?.frameElement : null;
        const off = host ? host.getBoundingClientRect() : { left: 0, top: 0 };
        return { x: off.left + r.left - PAD, y: off.top + r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
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

    function onMove(e: PointerEvent & { ccTarget?: EventTarget | null }) {
      if (e.pointerType === "touch") return;
      // Moves forwarded from the Event Lab carry the real element in ccTarget. Elements from
      // another document fail instanceof Element, so check for closest() instead.
      const raw = e.ccTarget ?? e.target;
      const el = raw && typeof (raw as Element).closest === "function" ? (raw as Element) : null;
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
    // Code previews are sandboxed, so their mouse moves never reach this page. Step aside
    // while the pointer is over one (the normal pointer shows there) instead of freezing.
    function onOver(e: MouseEvent) {
      const el = e.target as Element | null;
      if (el?.tagName === "IFRAME" && !(el as HTMLElement).dataset.cursorBridge) {
        hovered = null;
        root.classList.remove("cc-on");
      }
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

    // The Code theme swaps the dot for a [ >_ ] terminal block, and a click glitches it and
    // puffs a few 0s and 1s in the theme's accent colour.
    function spawn(x: number, y: number, glyph: string) {
      const el = document.createElement("span");
      el.className = "cc-particle";
      el.textContent = glyph;
      el.setAttribute("aria-hidden", "true");
      el.style.left = `${x - 7}px`;
      el.style.top = `${y - 7}px`;
      el.style.setProperty("--dx", `${(Math.random() - 0.5) * 60}px`);
      el.style.setProperty("--dy", `${-24 - Math.random() * 24}px`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }
    function onDown(e: PointerEvent) {
      if (e.pointerType === "touch" || root.dataset.world !== "matrix") return;
      dot!.classList.remove("cc-click");
      void dot!.offsetWidth;
      dot!.classList.add("cc-click");
      if (reduce.matches) return;
      for (const glyph of ["0", "1", "1", "0"]) spawn(e.clientX, e.clientY, glyph);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor", "cc-on", "cc-light");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", kick);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <div className="cc-layer" aria-hidden="true">
      <div ref={dotRef} className="cc-dot" />
      <div ref={frameRef} className="cc-frame">
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
