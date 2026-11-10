import { CSS_LESSONS } from "./css";
import { CSS_MORE_LESSONS } from "./css-more";
import { HTML_LESSONS } from "./html";
import { JS_LESSONS } from "./javascript";
import type { Lesson, LessonTopic } from "./types";

/** Learn content by topic, in teaching order. Slugs match Topic.slug in topics.ts. */
export const LESSON_TOPICS: LessonTopic[] = [
  { slug: "html", name: "HTML", lessons: HTML_LESSONS },
  { slug: "css", name: "CSS", lessons: [...CSS_LESSONS, ...CSS_MORE_LESSONS] },
  { slug: "javascript", name: "JavaScript", lessons: JS_LESSONS },
];

export const lessonHref = (topic: string, lesson: string) => `/learn/${topic}/${lesson}`;

/** The lesson, its topic, and the lessons before and after it across all topics. */
export function findLesson(topicSlug: string, lessonSlug: string) {
  const all = LESSON_TOPICS.flatMap((topic) => topic.lessons.map((lesson) => ({ topic, lesson })));
  const i = all.findIndex((item) => item.topic.slug === topicSlug && item.lesson.slug === lessonSlug);
  if (i === -1) return null;
  return { ...all[i], prev: all[i - 1] ?? null, next: all[i + 1] ?? null };
}

export type { Lesson, LessonTopic };
