/**
 * Lesson content is plain data, rendered by LessonBlocks. Text can mark code with
 * backticks, like "Use the `<p>` tag".
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  /** Code from the slides with a Copy button. preview is a full HTML page shown as the result. */
  | { type: "code"; code: string; label?: string; preview?: string; previewHeight?: number; output?: string }
  /** Term and meaning pairs, such as the parts of a tag. */
  | { type: "terms"; items: [term: string, meaning: string][] }
  | { type: "cards"; items: { title: string; tag?: string; text: string }[] }
  /** Explanation that goes beyond what the slides show. */
  | { type: "extra"; title: string; blocks: Block[] }
  | { type: "check"; question: string; options: string[]; answer: number; explanation: string }
  /** js: run the JavaScript and show console.log output (sandboxed). */
  | { type: "tryit"; starter: string; task: string; js?: boolean }
  /** A link to another page on the site, such as a CSS Playground tool. */
  | { type: "link"; href: string; text: string };

export type Lesson = {
  slug: string;
  title: string;
  /** One line under the title. */
  summary: string;
  minutes: number;
  blocks: Block[];
};

export type LessonTopic = {
  slug: string;
  name: string;
  lessons: Lesson[];
};

/** Wraps an HTML snippet in a page for the Result preview, with optional CSS. */
export function page(body: string, css = "") {
  return `<!DOCTYPE html><html><head><style>body{font-family:Times,serif;margin:16px;color:#111}${css}</style></head><body>${body}</body></html>`;
}
