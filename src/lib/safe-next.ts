/**
 * The page to go to after logging in, from the ?next= in the URL. Only paths on this
 * site are allowed, so a link can't send members to another website.
 */
export function safeNext(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }
  return next;
}
