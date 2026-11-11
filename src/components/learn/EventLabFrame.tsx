"use client";

import { useEffect, useRef, useState } from "react";

/** Shows the Event Lab (public/labs/event-lab.html) at its full height, so only the page scrolls. */
export function EventLabFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(2600);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== ref.current?.contentWindow) return;
      const h = Number(event.data?.eventLabHeight);
      if (h > 0) setHeight(Math.ceil(h) + 32); // a little headroom so no inner scrollbar appears
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      ref={ref}
      src="/labs/event-lab.html"
      title="JS Event Lab: try click, hover, type, keyboard, scroll, submit and change events"
      className="block w-full border-0"
      style={{ height }}
    />
  );
}
