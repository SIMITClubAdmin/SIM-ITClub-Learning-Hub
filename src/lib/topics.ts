export type Topic = {
  slug: "html" | "css" | "javascript";
  name: string;
  short: string;
  summary: string;
  /** Why this topic is locked, or null when it is open. */
  lockedReason: string | null;
};

// TODO(Practice step): work out locks from the member's real scores.
const UNLOCK_REASON = "Score 70% on HTML Easy to unlock";

export const TOPICS: Topic[] = [
  {
    slug: "html",
    name: "HTML",
    short: "HTML",
    summary: "Build the structure of a page with headings, links, images and lists.",
    lockedReason: null,
  },
  {
    slug: "css",
    name: "CSS",
    short: "CSS",
    summary: "Style pages with colours, spacing, layout and fonts.",
    lockedReason: UNLOCK_REASON,
  },
  {
    slug: "javascript",
    name: "JavaScript",
    short: "JS",
    summary: "Make pages interactive with variables, functions and events.",
    lockedReason: UNLOCK_REASON,
  },
];
