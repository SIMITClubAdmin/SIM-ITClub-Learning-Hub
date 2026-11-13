"use client";

import dynamic from "next/dynamic";

function StudioSkeleton() {
  return (
    <div className="flex h-[640px] items-center justify-center rounded border border-[#152238] bg-[#070b14] font-mono text-xs tracking-wider text-[#64748b] uppercase">
      <span className="gs-spinner mr-3" aria-hidden="true" />
      Loading the studio…
    </div>
  );
}

// xterm.js and the WebContainer API only work in the browser.
const GitStudio = dynamic(() => import("./GitStudio"), { ssr: false, loading: StudioSkeleton });

export function StudioLoader() {
  return <GitStudio />;
}
