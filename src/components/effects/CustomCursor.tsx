"use client";

import { useEffect, useRef } from "react";
import { caretSourceFor, onCaretMoved, type CaretSource } from "@/lib/cursor-caret";

const REST = 32;
const PAD = 6;
/** Room around a terminal caret: small, so the frame hugs the character being typed. */
const CARET_PAD = 4;
const TARGETS = "a, button, input, select, textarea, summary, [data-frame]";

/**
 * Dot plus four trailing corner brackets that frame hovered or keyboard-focused elements.
 * Over the Git studio's terminal, or while typing in it, the brackets sit on the text caret
 * instead and follow it as the student types. Does nothing on touch devices.
 * Add data-tone="light" to light surfaces to flip its color.
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
    let pointerEl: Element | null = null;
    let hovered: Element | null = null;
    let focused: Element | null = null;
    // Set by typing in a terminal, cleared when the mouse moves somewhere outside it.
    let typingIn: CaretSource | null = null;
    let cur = { x: 0, y: 0, w: REST, h: REST };
    let raf = 0;

    /** The terminal caret to frame: the one under the mouse, or the one being typed in. */
    function caret() {
      const source = caretSourceFor(pointerEl) ?? typingIn;
      const r = source?.rect();
      return r ? { x: r.x - CARET_PAD, y: r.y - CARET_PAD, w: r.w + CARET_PAD * 2, h: r.h + CARET_PAD * 2 } : null;
    }

    function target() {
      const c = caret();
      root.classList.toggle("cc-caret", !!c);
      if (c) return c;
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
      // Keep following while something can move under the frame: a hovered element or a caret.
      raf = gap < 0.3 && !hovered && !root.classList.contains("cc-caret") ? 0 : requestAnimationFrame(tick);
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
      pointerEl = el;
      // The mouse left the terminal: go back to following the mouse.
      if (typingIn && !(el && typingIn.el.contains(el))) typingIn = null;
      hovered = el?.closest(TARGETS) ?? null;
      root.classList.toggle("cc-light", !!el?.closest('[data-tone="light"]'));
      root.classList.add("cc-on");
      kick();
    }
    function onLeave() {
      pointerEl = null;
      root.classList.remove("cc-on");
    }
    // Code previews are sandboxed, so their mouse moves never reach this page. Step aside
    // while the pointer is over one (the normal pointer shows there) instead of freezing.
    function onOver(e: MouseEvent) {
      const el = e.target as Element | null;
      if (el?.tagName === "IFRAME" && !(el as HTMLElement).dataset.cursorBridge) {
        hovered = null;
        pointerEl = null;
        root.classList.remove("cc-on");
      }
    }
    function onEnter() {
      if (seen) root.classList.add("cc-on");
    }
    function onFocusIn(e: FocusEvent) {
      const el = e.target;
      if (!(el instanceof Element) || !el.matches(":focus-visible")) return;
      // A terminal's hidden input: the caret is framed instead, while typing or hovering.
      if (caretSourceFor(el)) return;
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
    function onKeyDown() {
      const source = caretSourceFor(document.activeElement);
      if (!source) return;
      typingIn = source;
      root.classList.add("cc-on");
      if (!seen) {
        const r = source.rect();
        if (r) cur = { x: r.x, y: r.y, w: r.w, h: r.h };
      }
      kick();
    }

    // Theme cursors: a click glitches the Code theme's [ >_ ] and puffs 0s and 1s, sheds
    // petals from the Sakura blossom, and scatters snowflakes from the Winter crystal.
    function spawn(x: number, y: number, glyph: string, kind = "") {
      const el = document.createElement("span");
      el.className = `cc-particle ${kind}`;
      el.textContent = glyph;
      el.setAttribute("aria-hidden", "true");
      el.style.left = `${x - 7}px`;
      el.style.top = `${y - 7}px`;
      const falls = kind === "cc-petal";
      el.style.setProperty("--dx", `${(Math.random() - 0.5) * (falls ? 80 : 60)}px`);
      el.style.setProperty("--dy", falls ? `${22 + Math.random() * 34}px` : `${-24 - Math.random() * 24}px`);
      el.style.setProperty("--rot", `${(Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 200)}deg`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1200);
    }
    function onDown(e: PointerEvent) {
      const world = root.dataset.world;
      if (e.pointerType === "touch" || !world) return;
      dot!.classList.remove("cc-click");
      void dot!.offsetWidth;
      dot!.classList.add("cc-click");
      if (reduce.matches) return;
      if (world === "matrix") for (const glyph of ["0", "1", "1", "0"]) spawn(e.clientX, e.clientY, glyph);
      else if (world === "sakura") for (let i = 0; i < 5; i++) spawn(e.clientX, e.clientY, "", "cc-petal");
      else if (world === "winter") for (const glyph of ["❄", "❅", "❆", "❄"]) spawn(e.clientX, e.clientY, glyph, "cc-flake");
    }

    onCaretMoved(kick);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      cancelAnimationFrame(raf);
      onCaretMoved(null);
      root.classList.remove("has-cursor", "cc-on", "cc-light", "cc-caret");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("keydown", onKeyDown, true);
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
