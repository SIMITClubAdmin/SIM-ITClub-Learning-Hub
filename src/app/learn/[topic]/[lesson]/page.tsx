import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonBlocks, splitSections } from "@/components/learn/LessonBlocks";
import { RememberTopic } from "@/components/learn/RememberTopic";
import { findLesson, LESSON_TOPICS, lessonHref } from "@/lib/lessons";

// Every lesson is built ahead of time, so reading the URL here does not slow navigation.
export const instant = false;

export function generateStaticParams() {
  return LESSON_TOPICS.flatMap((topic) => topic.lessons.map((lesson) => ({ topic: topic.slug, lesson: lesson.slug })));
}

export async function generateMetadata(props: PageProps<"/learn/[topic]/[lesson]">): Promise<Metadata> {
  const { topic, lesson } = await props.params;
  const found = findLesson(topic, lesson);
  return { title: found ? `${found.lesson.title} · ${found.topic.name} · ITCamp Learning Hub` : "Learn · ITCamp Learning Hub" };
}

export default async function LessonPage(props: PageProps<"/learn/[topic]/[lesson]">) {
  const { topic: topicSlug, lesson: lessonSlug } = await props.params;
  const found = findLesson(topicSlug, lessonSlug);
  if (!found) notFound();
  const { topic, lesson, prev, next } = found;
  const index = topic.lessons.indexOf(lesson);

  const { intro, sections } = splitSections(lesson.blocks);

  return (
    <main className="mx-auto grid w-full max-w-[96rem] flex-1 gap-8 px-4 py-8 sm:px-8 md:grid-cols-[13rem_1fr] lg:grid-cols-[15rem_1fr] xl:gap-14">
      <PageVeil />

      <nav aria-label={`${topic.name} lessons`} className="md:sticky md:top-6 md:h-[calc(100svh-8rem)] md:self-start md:overflow-y-auto md:border-r md:border-violet/50 md:pr-6">
        <Link href="/learn" className="font-mono text-xs tracking-wider text-dim uppercase hover:text-accent">
          ← All topics
        </Link>
        <p className="mt-5 font-mono text-xs tracking-wider text-accent uppercase">{topic.name}</p>
        <ol className="mt-2 flex flex-col gap-0.5">
          {topic.lessons.map((item, i) => {
            const current = item.slug === lesson.slug;
            return (
              <li key={item.slug}>
                <Link
                  href={lessonHref(topic.slug, item.slug)}
                  aria-current={current ? "page" : undefined}
                  className={`block py-1.5 text-sm ${current ? "font-semibold text-ink" : "text-dim hover:text-ink"}`}
                >
                  <span className="mr-2 font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                  {item.title}
                </Link>
                {/* The current lesson lists its sections, so students can jump straight to one. */}
                {current && sections.length > 0 && (
                  <ol className="mb-2 ml-7 flex flex-col">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a href={`#${section.id}`} className="block py-1 text-sm text-dim hover:text-accent">
                          {section.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-col gap-1.5 font-mono text-xs tracking-wider uppercase">
          {LESSON_TOPICS.filter((t) => t.slug !== topic.slug).map((t) => (
            <Link key={t.slug} href={lessonHref(t.slug, t.lessons[0].slug)} className="text-dim hover:text-accent">
              {t.name} →
            </Link>
          ))}
        </div>
      </nav>

      <article className="flex max-w-6xl min-w-0 flex-col gap-14 pb-16">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-xs tracking-wider text-accent uppercase">
            {topic.name} · Lesson {index + 1} of {topic.lessons.length} · About {lesson.minutes} minutes
          </p>
          <h1 className="text-4xl font-semibold sm:text-6xl">{lesson.title}</h1>
          <p className="text-xl text-dim">{lesson.summary}</p>
          {topic.slug === "javascript" && (
            // Same running-light button as the CSS Playground one.
            <Link href="/learn/event-lab" className="pg-cta self-start">
              <span className="pg-cta-inner">
                <span aria-hidden="true">⚡</span> Try events live in the JS Event Lab →
              </span>
            </Link>
          )}
          {topic.slug === "css" && (
            // A light runs round the border, like the playground's colour wheel.
            <Link href="/learn/playground" className="pg-cta self-start">
              <span className="pg-cta-inner">
                <span aria-hidden="true">✦</span> Try CSS live in the CSS Playground →
              </span>
            </Link>
          )}
          {intro.length > 0 && (
            <div className="mt-2 flex flex-col gap-5">
              <LessonBlocks blocks={intro} />
            </div>
          )}
        </header>

        <RememberTopic slug={topic.slug} />

        {/* Each subtopic is its own section, numbered to match the sidebar. */}
        {sections.map((section, i) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-6">
            <p className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</p>
            <h2 id={`${section.id}-title`} className="mt-1 text-3xl font-semibold sm:text-4xl">
              {section.title}
            </h2>
            <div className="mt-5 flex flex-col gap-5">
              <LessonBlocks blocks={section.blocks} />
            </div>
          </section>
        ))}

        <footer className="flex flex-wrap items-center justify-between gap-4">
          {prev ? (
            <Link
              href={lessonHref(prev.topic.slug, prev.lesson.slug)}
              className="text-dim underline underline-offset-4 hover:text-ink"
            >
              ← {prev.lesson.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={lessonHref(next.topic.slug, next.lesson.slug)} className="cta cta--lg">
              Next: {next.lesson.title}
            </Link>
          )}
        </footer>
      </article>
    </main>
  );
}
