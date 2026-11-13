"use client";

import dynamic from "next/dynamic";
import type { StudioKind } from "./GitStudio";

function StudioSkeleton() {
  return (
    <div className="gs-ui flex h-[640px] items-center justify-center rounded border border-(--border-subtle) bg-(--bg-surface) text-sm tracking-wider text-(--text-muted) uppercase">
      <span className="gs-spinner mr-3" aria-hidden="true" />
      Loading the studio…
    </div>
  );
}

// xterm.js and the WebContainer API only work in the browser.
const GitStudio = dynamic(() => import("./GitStudio"), { ssr: false, loading: StudioSkeleton });

/** The Git sandbox, set up for one lesson's activity. Only one per page (one WebContainer per tab). */
export function StudioLoader({ kind }: { kind: StudioKind }) {
  return <GitStudio kind={kind} />;
}
