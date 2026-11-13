/**
 * The Git & GitHub track is the only cross-origin isolated part of the site (COOP/COEP
 * headers in next.config.ts). Those headers only apply on a full page load, so links into
 * or out of it must not use client-side navigation.
 */
export const GIT_TRACK_PATH = "/learn/git";

export function isGitTrackPath(pathname: string) {
  return pathname === GIT_TRACK_PATH || pathname.startsWith(`${GIT_TRACK_PATH}/`);
}

/** True for hrefs that must be a plain <a>, not a <Link>, such as "/learn/git#playground". */
export function needsFullPageLoad(href: string) {
  return isGitTrackPath(href.split(/[?#]/)[0]);
}
