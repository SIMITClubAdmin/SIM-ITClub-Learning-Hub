"use client";

import "./git-studio.css";
import type { ReactNode } from "react";
import { useIsolationGuard } from "./useIsolationGuard";

/** Page frame for a Skull Trial: the studio's look, and the cross-origin isolation its WebContainer needs. */
export function SkullTrialShell({ children }: { children: ReactNode }) {
  useIsolationGuard();
  return (
    <div className="gs-theme flex w-full flex-1 flex-col">
      <main className="relative mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
