"use client";

import { useEffect, useRef, useState } from "react";

/** Shows the Event Lab (public/labs/event-lab.html) at its full height, so only the page scrolls. */
export function EventLabFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(2600);

  // The site's custom cursor only hears the mouse on this page, so inside the lab it would
  // freeze at the frame's edge. Pass the lab's mouse moves up (same site, so this is allowed)
  // and hide the normal pointer in the lab, so one cursor follows the mouse everywhere.
  function connectCursor() {
    const frame = ref.current;
    const win = frame?.contentWindow;
    const doc = frame?.contentDocument;
    // Each load is a fresh document; mark it so it is only wired once.
    if (!frame || !win || !doc || doc.documentElement.dataset.cursorLinked) return;
    doc.documentElement.dataset.cursorLinked = "1";
    if (document.documentElement.classList.contains("has-cursor")) {
      const style = doc.createElement("style");
      style.textContent = "*, *::before, *::after { cursor: none !important; }";
      doc.head.appendChild(style);
    }
    win.addEventListener(
      "pointermove",
      (e) => {
        const box = frame.getBoundingClientRect();
        const move = new PointerEvent("pointermove", {
          clientX: box.left + e.clientX,
          clientY: box.top + e.clientY,
          pointerType: e.pointerType,
        });
        // The real element under the mouse, so the cursor can frame lab buttons too.
        window.dispatchEvent(Object.assign(move, { ccTarget: e.target }));
      },
      { passive: true },
    );
  }

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== ref.current?.contentWindow) return;
      const h = Number(event.data?.eventLabHeight);
      if (h > 0) setHeight(Math.ceil(h) + 32); // a little headroom so no inner scrollbar appears
    }
    window.addEventListener("message", onMessage);
    // The lab may finish loading before React attaches onLoad, so also connect here.
    if (ref.current?.contentDocument?.readyState === "complete") connectCursor();
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      onLoad={connectCursor}
      data-cursor-bridge="1"
      src="/labs/event-lab.html"
      title="JS Event Lab: try click, hover, type, keyboard, scroll, submit and change events"
      className="block w-full border-0"
      style={{ height }}
    />
  );
}
