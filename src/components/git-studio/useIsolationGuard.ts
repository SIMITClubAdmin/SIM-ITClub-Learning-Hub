"use client";

import { useEffect } from "react";
import { isGitTrackPath as isGitPath } from "./isolation";

const RELOAD_FLAG = "gs-isolation-reload";

/**
 * The COOP/COEP headers on /learn/git only apply to a full page load, but the site's
 * <Link>s navigate client-side. So: reload once if we arrived without isolation, and leave
 * with a full load too, so the isolation headers never follow the student to other pages.
 */
export function useIsolationGuard() {
  useEffect(() => {
    try {
      if (!window.crossOriginIsolated) {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, "1");
          window.location.reload();
          return;
        }
      } else {
        sessionStorage.removeItem(RELOAD_FLAG);
      }
    } catch {
      // Storage blocked: the studio falls back to the built-in engine instead.
    }

    // Runs before React's own click handling, so Next's router never takes these links.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || isGitPath(url.pathname)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(url.href);
    };
    const onPopState = () => {
      if (!isGitPath(window.location.pathname)) window.location.reload();
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);
}
