/**
 * The Git & GitHub track and the Skull Trials are the only cross-origin isolated parts of the
 * site (COOP/COEP headers in next.config.ts), because they run the studio. Those headers only
 * apply on a full page load, so links into or out of them must not use client-side navigation.
 */
export const GIT_TRACK_PATH = "/learn/git";
const ISOLATED_PATHS = [GIT_TRACK_PATH, "/practice/skull"];

export function isGitTrackPath(pathname: string) {
  return ISOLATED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** True for hrefs that must be a plain <a>, not a <Link>, such as "/learn/git#playground". */
export function needsFullPageLoad(href: string) {
  return isGitTrackPath(href.split(/[?#]/)[0]);
}
