import { notFound, redirect } from "next/navigation";
import { LESSON_TOPICS, lessonHref } from "@/lib/lessons";

export const instant = false;

export function generateStaticParams() {
  return LESSON_TOPICS.map((topic) => ({ topic: topic.slug }));
}

/** /learn/html and friends open the topic's first lesson. */
export default async function TopicPage(props: PageProps<"/learn/[topic]">) {
  const { topic: slug } = await props.params;
  const topic = LESSON_TOPICS.find((t) => t.slug === slug);
  if (!topic) notFound();
  redirect(lessonHref(topic.slug, topic.lessons[0].slug));
}
