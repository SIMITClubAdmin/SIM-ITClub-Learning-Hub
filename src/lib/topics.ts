export type Topic = {
  slug: string;
  name: string;
  /** Label inside the moon or planet; keep it short. */
  short: string;
  summary: string;
  /** Why this topic is locked, or null when it is open. */
  lockedReason: string | null;
  /** Lessons on the Learn page. Only lessons with an href exist yet. */
  lessons: { title: string; href?: string }[];
};

export type PlanetPalette = {
  base: string;
  /** Six band colours, top to bottom. */
  bands: string[];
  storm: string;
  rim: string;
  ring: string;
  glow: string;
  /** One colour per open moon, left to right. */
  moons: string[];
};

export type CourseModule = {
  slug: string;
  number: number;
  title: string;
  /** Why the whole planet is locked, or null when it is open. */
  lockedReason: string | null;
  palette: PlanetPalette;
  topics: Topic[];
};

// TODO(Practice step): work out locks from the member's real scores.
const UNLOCK_REASON = "Finish the HTML questions to unlock";

export const TOPICS: Topic[] = [
  {
    slug: "html",
    name: "HTML",
    short: "HTML",
    summary: "Build the structure of a page with headings, links, images and lists.",
    lockedReason: null,
    lessons: [
      { title: "What is HTML?", href: "/learn/html/what-is-html" },
      { title: "Headings, paragraphs and line breaks" },
      { title: "Images and links" },
      { title: "Comments" },
      { title: "div: the box tag" },
      { title: "Semantic tags" },
    ],
  },
  {
    slug: "css",
    name: "CSS",
    short: "CSS",
    summary: "Style pages with colours, spacing, layout and fonts.",
    lockedReason: UNLOCK_REASON,
    lessons: [
      { title: "What is CSS?" },
      { title: "Inline, internal and external CSS" },
      { title: "Selectors" },
    ],
  },
  {
    slug: "javascript",
    name: "JavaScript",
    short: "JS",
    summary: "Make pages interactive with variables, functions and events.",
    lockedReason: UNLOCK_REASON,
    lessons: [{ title: "What is JavaScript?" }],
  },
];

// Example second lesson, so the multi-planet Practice page has somewhere to go.
const GIT_TOPICS: Topic[] = [
  {
    slug: "git-basics",
    name: "Git basics",
    short: "GIT",
    summary: "Save versions of your project with commits.",
    lockedReason: "Finish Lesson 1 to unlock",
    lessons: [],
  },
  {
    slug: "branches",
    name: "Branches",
    short: "BRANCH",
    summary: "Try ideas safely on a branch, then merge them.",
    lockedReason: "Finish Lesson 1 to unlock",
    lessons: [],
  },
  {
    slug: "github",
    name: "GitHub",
    short: "HUB",
    summary: "Push your code online and work with teammates.",
    lockedReason: "Finish Lesson 1 to unlock",
    lessons: [],
  },
];

export const MODULES: CourseModule[] = [
  {
    slug: "web-basics",
    number: 1,
    title: "HTML, CSS and JavaScript",
    lockedReason: null,
    palette: {
      base: "#4a3db0",
      bands: ["#6a58d6", "#a493f5", "#5646c2", "#b8a9ff", "#6150cc", "#9584ec"],
      storm: "#be3caa",
      rim: "#4fd8eb",
      ring: "#d4caff",
      glow: "#6d4aff",
      moons: ["#be3caa", "#4f6cf0", "#1ea3c0"],
    },
    topics: TOPICS,
  },
  {
    slug: "git",
    number: 2,
    title: "Git and GitHub",
    lockedReason: "Finish Lesson 1 to unlock",
    palette: {
      base: "#8a3a2c",
      bands: ["#c2553f", "#f2a47a", "#a8432f", "#ffc49e", "#b44a35", "#e8835f"],
      storm: "#ffe0b8",
      rim: "#ffb38a",
      ring: "#ffd9c2",
      glow: "#f05033",
      moons: ["#f05033", "#e8a23a", "#c0507a"],
    },
    topics: GIT_TOPICS,
  },
  {
    slug: "lesson-3",
    number: 3,
    title: "Coming soon",
    lockedReason: "Finish Lesson 2 to unlock",
    palette: {
      base: "#14605e",
      bands: ["#1e8a85", "#7fd8c8", "#177570", "#a6ead9", "#1b7f79", "#58c2b4"],
      storm: "#e6f1ff",
      rim: "#7fe6d4",
      ring: "#c8f5ec",
      glow: "#1ea3c0",
      moons: ["#1ea3c0", "#3fbf8f", "#4f6cf0"],
    },
    // Placeholder moons until the Lesson 3 topics are decided.
    topics: [1, 2, 3].map((n) => ({
      slug: `lesson-3-topic-${n}`,
      name: `Topic ${n}`,
      short: "?",
      summary: "This topic is still being planned.",
      lockedReason: "Finish Lesson 2 to unlock",
      lessons: [],
    })),
  },
];
