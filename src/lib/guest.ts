/**
 * Guest mode: visitors who aren't subcomms can read the notes and try the quizzes without
 * an account. Nothing they do is saved. The cookie only says "this browser chose guest
 * mode"; it unlocks nothing that needs a real account, so the browser may read it too.
 */
export const GUEST_COOKIE = "itc_guest";

/** One week. */
export const GUEST_COOKIE_SECONDS = 60 * 60 * 24 * 7;

/** Browser-side check, for the header. */
export function isGuestInBrowser() {
  return typeof document !== "undefined" && document.cookie.split("; ").some((c) => c === `${GUEST_COOKIE}=1`);
}
