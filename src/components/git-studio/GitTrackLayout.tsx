"use client";

import "./git-studio.css";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useIsolationGuard } from "./useIsolationGuard";

type TrackLayout = { expanded: boolean; toggleExpanded: () => void };

const TrackLayoutContext = createContext<TrackLayout>({ expanded: false, toggleExpanded: () => {} });

export function useTrackLayout() {
  return useContext(TrackLayoutContext);
}

/** Wide two-column shell. "Expand studio" hides the lesson sidebar and lifts the width cap. */
export function GitTrackLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  useIsolationGuard();
  const value = useMemo(() => ({ expanded, toggleExpanded: () => setExpanded((v) => !v) }), [expanded]);

  return (
    <TrackLayoutContext.Provider value={value}>
      <main className={`relative mx-auto w-full flex-1 px-4 py-8 sm:px-8 ${expanded ? "max-w-none" : "max-w-[1720px]"}`}>
        <div className="gs-page-bg" aria-hidden="true" />
        <div className="flex flex-col gap-8 md:flex-row xl:gap-12">
          {!expanded && (
            <aside className="w-full shrink-0 md:sticky md:top-6 md:h-[calc(100svh-8rem)] md:w-64 md:self-start md:overflow-y-auto md:border-r md:border-[#152238] md:pr-6 lg:w-72">
              {sidebar}
            </aside>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-16 pb-16">{children}</div>
        </div>
      </main>
    </TrackLayoutContext.Provider>
  );
}
