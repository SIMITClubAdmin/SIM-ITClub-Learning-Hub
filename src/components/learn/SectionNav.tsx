"use client";

import { useEffect, useRef, useState } from "react";

type Section = { id: string; title: string };

/** How far down the window a section's top must pass to count as the one being read. */
const READ_LINE = 0.3;

/**
 * The current lesson's section links, with a scroll-spy: the section being read is highlighted
 * as the student scrolls, and clicking a link scrolls smoothly to it and marks it at once.
 */
export function SectionNav({ sections, className = "" }: { sections: Section[]; className?: string }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const listRef = useRef<HTMLOListElement>(null);
  // After a click, the clicked section stays marked until its smooth scroll has settled.
  const clickLock = useRef(false);
  const settle = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ids = sections.map((s) => s.id).join(" ");

  useEffect(() => {
    const els = ids
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const compute = () => {
      if (clickLock.current) return;
      const line = window.innerHeight * READ_LINE;
      let current = els[0].id;
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      // At the very bottom, short last sections can never reach the line: mark the last one.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = els[els.length - 1].id;
      setActive(current);
    };

    // A section's top crossing the reading line is exactly when the answer can change.
    const observer = new IntersectionObserver(compute, { rootMargin: `0px 0px -${100 - READ_LINE * 100}% 0px` });
    els.forEach((el) => observer.observe(el));
    let raf = 0;
    const onScroll = () => {
      if (clickLock.current) {
        clearTimeout(settle.current);
        settle.current = setTimeout(() => (clickLock.current = false), 160);
        return;
      }
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          compute();
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    compute();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(settle.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ids]);

  // Keep the marked link in view inside a scrolling sidebar, without moving the page.
  useEffect(() => {
    const link = listRef.current?.querySelector<HTMLElement>(`[data-section="${CSS.escape(active)}"]`);
    let box = link?.parentElement ?? null;
    while (box && box !== document.body) {
      const overflow = getComputedStyle(box).overflowY;
      if ((overflow === "auto" || overflow === "scroll") && box.scrollHeight > box.clientHeight) break;
      box = box.parentElement;
    }
    if (!link || !box || box === document.body) return;
    const l = link.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (l.top < b.top + 8) box.scrollTop -= b.top + 8 - l.top;
    else if (l.bottom > b.bottom - 8) box.scrollTop += l.bottom - (b.bottom - 8);
  }, [active]);

  return (
    <ol ref={listRef} className={`flex flex-col gap-0.5 ${className}`}>
      {sections.map((section) => {
        const on = section.id === active;
        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              data-section={section.id}
              aria-current={on ? "location" : undefined}
              onClick={(e) => {
                const el = document.getElementById(section.id);
                if (!el) return;
                e.preventDefault();
                setActive(section.id);
                clickLock.current = true;
                clearTimeout(settle.current);
                // Unlocks once scrolling stops, or straight away if there was nowhere to scroll.
                settle.current = setTimeout(() => (clickLock.current = false), 400);
                const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
                el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                history.replaceState(null, "", `#${section.id}`);
              }}
              className={`block border-l-2 py-1 pl-3 text-sm transition-colors ${
                on
                  ? "border-(--accent-primary) bg-(--accent-soft) font-semibold text-(--accent-text)"
                  : "border-transparent text-(--text-muted) hover:text-(--accent-text)"
              }`}
            >
              {section.title}
            </a>
          </li>
        );
      })}
    </ol>
  );
}
