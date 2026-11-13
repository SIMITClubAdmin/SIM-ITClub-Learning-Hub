"use client";

import "./git-studio.css";
import type { ReactNode } from "react";
import { useIsolationGuard } from "./useIsolationGuard";

/**
 * Wide two-column shell for every Git & GitHub page. Colours and fonts come from the site's
 * Appearance settings (on <html>); the studio's "Expand" mode is its own full-screen overlay.
 */
export function GitTrackLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  useIsolationGuard();
  return (
    <div className="gs-theme flex w-full flex-1 flex-col">
      <main className="relative mx-auto w-full max-w-[1720px] flex-1 px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row xl:gap-12">
          <aside className="w-full shrink-0 md:sticky md:top-6 md:h-[calc(100svh-8rem)] md:w-64 md:self-start md:overflow-y-auto md:border-r md:border-(--border-subtle) md:pr-6 lg:w-72">
            {sidebar}
          </aside>
          <div className="flex min-w-0 flex-1 flex-col gap-14 pb-16">{children}</div>
        </div>
      </main>
    </div>
  );
}
