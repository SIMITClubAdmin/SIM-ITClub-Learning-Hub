import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/learn/CodeBlock";
import { QuickCheck } from "@/components/learn/QuickCheck";
import { TryIt } from "@/components/learn/TryIt";

export const metadata: Metadata = { title: "What is HTML? · ITCamp Learning Hub" };

// Example lesson built from the Lesson 1 script. Later lessons will come from shared data.
const LESSONS = [
  { title: "What is HTML?", href: "/learn/html/what-is-html", current: true },
  { title: "Headings, paragraphs and line breaks" },
  { title: "Images and links" },
  { title: "Comments" },
  { title: "div: the box tag" },
  { title: "Semantic tags" },
];

const SKELETON = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>My first page</title>
  </head>
  <body>
    <h1>Hello IT Camp</h1>
  </body>
</html>`;

const STARTER = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>My first page</title>
  </head>
  <body>
    <h1>Hello IT Camp</h1>
    <p>Change me!</p>
  </body>
</html>`;

const PARTS = [
  { term: "<!DOCTYPE html>", text: "Tells the browser this is an HTML5 document." },
  { term: 'lang="en"', text: "Says the main language of the page is English." },
  { term: "<head>", text: "Holds information about the page. The page does not show it." },
  { term: "<body>", text: "Holds everything the user sees on the page." },
];

export default function WhatIsHtmlLesson() {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[15rem_1fr]">
      <nav aria-label="HTML lessons" className="lg:sticky lg:top-6 lg:self-start">
        <p className="font-mono text-xs tracking-wider text-accent uppercase">HTML · Lesson 1 of 6</p>
        <ol className="mt-4 flex flex-col gap-1 border-l border-violet">
          {LESSONS.map((lesson, i) => (
            <li key={lesson.title}>
              {lesson.href ? (
                <Link
                  href={lesson.href}
                  aria-current={lesson.current ? "page" : undefined}
                  className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm ${
                    lesson.current ? "border-accent text-ink" : "border-transparent text-dim hover:text-ink"
                  }`}
                >
                  {i + 1}. {lesson.title}
                </Link>
              ) : (
                <span className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-dim/60">
                  {i + 1}. {lesson.title}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <article className="flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-xs tracking-wider text-dim uppercase">About 10 minutes</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">What is HTML?</h1>
          <p className="text-lg text-dim">
            HTML means HyperText Markup Language. It defines the structure and the content of a web
            page.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">The three parts of every webpage</h2>
          <p className="text-dim">Think of a webpage like a person.</p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              ["HTML", "The skeleton", "Gives the structure."],
              ["CSS", "The skin", "Gives the appearance."],
              ["JavaScript", "The brain", "Gives the logic."],
            ].map(([name, role, text]) => (
              <li key={name} className="border border-violet bg-bg/90 p-4">
                <p className="font-display text-xl font-semibold">{name}</p>
                <p className="mt-1 text-accent">{role}</p>
                <p className="mt-1 text-sm text-dim">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">Anatomy of an element</h2>
          <p className="text-dim">
            A page is built from elements, like LEGO bricks. Most elements have an opening tag, some
            content, and a closing tag.
          </p>
          <div className="flex flex-wrap items-end justify-center gap-1 border border-violet bg-bg/90 px-4 py-6 font-mono text-lg">
            {[
              ["<p>", "Opening tag"],
              ["Hello IT Camp", "Content"],
              ["</p>", "Closing tag"],
            ].map(([code, label]) => (
              <span key={label} className="flex flex-col items-center gap-2">
                <span className="text-xs tracking-wider text-accent uppercase">{label}</span>
                <span className="border-t-2 border-accent px-2 pt-2">{code}</span>
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold">The HTML skeleton</h2>
          <p className="text-dim">Every HTML page starts with this basic structure.</p>
          <CodeBlock code={SKELETON} label="index.html" />
          <dl className="grid gap-3 sm:grid-cols-2">
            {PARTS.map((part) => (
              <div key={part.term} className="border-l-2 border-violet pl-4">
                <dt className="font-mono text-sm text-accent">{part.term}</dt>
                <dd className="mt-1 text-sm text-dim">{part.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <QuickCheck
          question="The text “Hello IT Camp” is inside the h1. Is it in the head or the body?"
          options={["The head", "The body"]}
          answer={1}
          explanation="The body holds everything the user sees."
        />

        <TryIt
          starter={STARTER}
          task="Change the heading to your own name, then add a second paragraph below it."
        />

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-violet pt-6">
          <Link href="/learn" className="text-dim underline underline-offset-4 hover:text-ink">
            All topics
          </Link>
          <span className="cta pointer-events-none opacity-60" aria-disabled="true">
            Next: Headings (coming soon)
          </span>
        </footer>
      </article>
    </main>
  );
}
