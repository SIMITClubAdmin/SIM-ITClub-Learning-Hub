"use client";

import "./git-studio.css";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { APPEARANCE_SCRIPT, THEME_ROOT_ID, useAppearance } from "./appearance";
import { comicNeue, jakarta } from "./fonts";
import { useIsolationGuard } from "./useIsolationGuard";

type TrackLayout = { expanded: boolean; toggleExpanded: () => void };

const TrackLayoutContext = createContext<TrackLayout>({ expanded: false, toggleExpanded: () => {} });

export function useTrackLayout() {
  return useContext(TrackLayoutContext);
}

/**
 * Runs during HTML parsing on a full load. On the client it renders as inert text/plain,
 * so React never re-runs it (see Next's "Preventing flash before hydration" guide).
 */
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Themed, wide two-column shell. "Expand studio" hides the lesson sidebar and lifts the width cap. */
export function GitTrackLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const { theme, font } = useAppearance();
  useIsolationGuard();
  const value = useMemo(() => ({ expanded, toggleExpanded: () => setExpanded((v) => !v) }), [expanded]);

  return (
    <TrackLayoutContext.Provider value={value}>
      {/* The saved theme lands on this element before first paint, so the DOM may differ from
          the server's defaults; suppressHydrationWarning lets React keep it. */}
      <div
        id={THEME_ROOT_ID}
        className={`gs-theme ${jakarta.variable} ${comicNeue.variable} flex w-full flex-1 flex-col`}
        data-gs-theme={theme}
        data-gs-font={font}
        // The site cursor turns dark over light surfaces.
        data-tone={theme === "purple-light" ? "light" : undefined}
        suppressHydrationWarning
      >
        <InlineScript html={APPEARANCE_SCRIPT} />
        <main className={`relative mx-auto w-full flex-1 px-4 py-8 sm:px-8 ${expanded ? "max-w-none" : "max-w-[1720px]"}`}>
          <div className="flex flex-col gap-8 md:flex-row xl:gap-12">
            {!expanded && (
              <aside className="w-full shrink-0 md:sticky md:top-6 md:h-[calc(100svh-8rem)] md:w-64 md:self-start md:overflow-y-auto md:border-r md:border-(--border-subtle) md:pr-6 lg:w-72">
                {sidebar}
              </aside>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-16 pb-16">{children}</div>
          </div>
        </main>
      </div>
    </TrackLayoutContext.Provider>
  );
}
