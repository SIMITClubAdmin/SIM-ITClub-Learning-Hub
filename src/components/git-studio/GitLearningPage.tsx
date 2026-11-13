import Link from "next/link";
import type { ReactNode } from "react";
import { LESSON_TOPICS, lessonHref } from "@/lib/lessons";
import { GitTrackLayout } from "./GitTrackLayout";
import { IntroductionLesson, CoreWorkflowLesson, WorkingWithGithubLesson } from "./lessons/lessons-01-03";
import { BranchingLesson, PullRequestsLesson, TipsLesson } from "./lessons/lessons-04-06";
import { AdvancedLesson, SandboxLesson } from "./lessons/lessons-extra";
import { findGitLesson, GIT_LESSONS, gitLessonHref, type GitLesson } from "./lessons/registry";

const CONTENT: Record<string, () => ReactNode> = {
  introduction: IntroductionLesson,
  "core-workflow": CoreWorkflowLesson,
  "working-with-github": WorkingWithGithubLesson,
  branching: BranchingLesson,
  "pull-requests-conflicts": PullRequestsLesson,
  "tips-cheatsheet": TipsLesson,
  sandbox: SandboxLesson,
  advanced: AdvancedLesson,
};

function AdditionalPill() {
  return <span className="gs-ui rounded-sm border border-(--git-modified) px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-(--git-modified) uppercase">Additional content</span>;
}

function LessonLink({ lesson, current }: { lesson: GitLesson; current: boolean }) {
  return (
    <li>
      <Link
        href={gitLessonHref(lesson.slug)}
        aria-current={current ? "page" : undefined}
        className={`flex gap-2 py-1.5 text-sm ${current ? "font-semibold text-(--text-main)" : "text-(--text-muted) hover:text-(--text-main)"}`}
      >
        <span className="gs-ui w-6 shrink-0 text-xs leading-5 text-(--accent-text)">{lesson.number}</span>
        <span>{lesson.title}</span>
      </Link>
      {current && (
        <ol className="mb-2 ml-8 flex flex-col">
          {lesson.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="block py-1 text-sm text-(--text-muted) hover:text-(--accent-text)">
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

function Sidebar({ current }: { current: string }) {
  const core = GIT_LESSONS.filter((l) => !l.additional);
  const extra = GIT_LESSONS.filter((l) => l.additional);
  return (
    <nav aria-label="Git & GitHub lessons">
      {/* useIsolationGuard turns links out of the Git pages into full page loads. */}
      <Link href="/learn" className="gs-ui text-xs tracking-wider text-(--text-muted) uppercase hover:text-(--accent-text)">
        ← All topics
      </Link>
      <p className="gs-ui mt-5 text-xs tracking-wider text-(--accent-text) uppercase">Git &amp; GitHub</p>
      <p className="gs-ui mt-1 text-[11px] tracking-wider text-(--text-faint) uppercase">Core workshop · Lesson 2 slides</p>
      <ol className="mt-2 flex flex-col gap-0.5">
        {core.map((lesson) => (
          <LessonLink key={lesson.slug} lesson={lesson} current={lesson.slug === current} />
        ))}
      </ol>
      <div className="mt-6 border-t border-(--border-subtle) pt-4">
        <AdditionalPill />
        <p className="mt-2 text-xs text-(--text-muted)">Extra pages that go beyond the workshop slides.</p>
        <ol className="mt-2 flex flex-col gap-0.5">
          {extra.map((lesson) => (
            <LessonLink key={lesson.slug} lesson={lesson} current={lesson.slug === current} />
          ))}
        </ol>
      </div>
      <div className="gs-ui mt-6 flex flex-col gap-1.5 text-xs tracking-wider uppercase">
        {LESSON_TOPICS.map((topic) => (
          <Link key={topic.slug} href={lessonHref(topic.slug, topic.lessons[0].slug)} className="text-(--text-muted) hover:text-(--accent-text)">
            {topic.name} →
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** One page of the Git & GitHub track. */
export function GitLessonPage({ slug }: { slug: string }) {
  const found = findGitLesson(slug)!;
  const { lesson, prev, next } = found;
  const core = GIT_LESSONS.filter((l) => !l.additional);
  const Content = CONTENT[slug];
  return (
    <GitTrackLayout sidebar={<Sidebar current={slug} />}>
      <header id="top" className="flex max-w-4xl scroll-mt-6 flex-col gap-4">
        <p className="gs-ui flex flex-wrap items-center gap-3 text-xs tracking-wider text-(--accent-text) uppercase">
          {lesson.additional ? (
            <>
              <AdditionalPill /> Git &amp; GitHub · {lesson.number}
            </>
          ) : (
            <>
              Git &amp; GitHub · Lesson 2 · Part {lesson.number} of {String(core.length).padStart(2, "0")}
            </>
          )}
          <span className="text-(--text-muted)">· About {lesson.minutes} minutes</span>
        </p>
        <h1 className="gs-heading text-4xl font-semibold sm:text-6xl">{lesson.title}</h1>
        <p className="text-xl text-(--text-muted)">{lesson.summary}</p>
      </header>

      <Content />

      <footer className="flex max-w-4xl flex-wrap items-center justify-between gap-4">
        {prev ? (
          <Link href={gitLessonHref(prev.slug)} className="text-(--text-muted) underline underline-offset-4 hover:text-(--text-main)">
            ← {prev.number} {prev.title}
          </Link>
        ) : (
          <Link href="/learn" className="text-(--text-muted) underline underline-offset-4 hover:text-(--text-main)">
            ← All topics
          </Link>
        )}
        {next && (
          <Link href={gitLessonHref(next.slug)} className="cta cta--lg">
            Next: {next.number} {next.title}
          </Link>
        )}
      </footer>
    </GitTrackLayout>
  );
}
