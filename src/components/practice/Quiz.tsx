"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { answerQuestion, startQuiz, type Feedback, type Round } from "@/app/practice/actions";
import { MAX_ATTEMPTS } from "@/lib/quiz-meta";
import { useSfx } from "@/lib/use-sfx";

const LETTERS = ["A", "B", "C", "D"];

type Props = {
  slug: string;
  title: string;
  lesson: number;
  mode: "member" | "guest";
  /** Members: the attempt this button starts or continues (1 or 2). */
  attemptNo?: number;
  /** Members: an unfinished attempt exists, so the button continues it. */
  resuming?: boolean;
};

export function Quiz({ slug, title, lesson, mode, attemptNo = 1, resuming = false }: Props) {
  const router = useRouter();
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<(Feedback | null)[]>([]);
  const [busy, setBusy] = useState(false);
  // The choice being checked by the server, shown straight away so a click never feels ignored.
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const answersRef = useRef<HTMLUListElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const { play } = useSfx();

  const current = round && index < round.questions.length ? feedback[index] : null;
  const hasAnswered = !!current;

  // Once the feedback bar appears: keep every answer visible above it, and move keyboard focus to Next.
  useEffect(() => {
    if (!hasAnswered) return;
    const answers = answersRef.current?.getBoundingClientRect();
    const barHeight = barRef.current?.offsetHeight;
    if (spacerRef.current && barHeight) spacerRef.current.style.height = `${barHeight + 16}px`;
    if (answers && barHeight) {
      const barTop = window.innerHeight - barHeight;
      if (answers.bottom > barTop - 16) window.scrollBy({ top: answers.bottom - barTop + 16, behavior: "smooth" });
    }
    nextRef.current?.focus({ preventScroll: true });
  }, [hasAnswered, index]);

  async function start() {
    play("click");
    setBusy(true);
    setError("");
    const result = await startQuiz(slug);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRound(result.round);
    setFeedback(result.round.answered);
    // Resuming: carry on from the first question not answered yet.
    const firstOpen = result.round.answered.findIndex((a) => a === null);
    setIndex(firstOpen === -1 ? result.round.questions.length : firstOpen);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  async function pick(choice: string) {
    if (!round || busy || feedback[index]) return;
    setBusy(true);
    setPending(choice);
    setError("");
    const question = round.questions[index];
    const result = await answerQuestion(slug, round.attemptId, index + 1, question.id, choice);
    setBusy(false);
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    play(result.correct ? "correct" : "wrong");
    setFeedback((f) => f.map((item, i) => (i === index ? result : item)));
  }

  function next() {
    play("click");
    setIndex((i) => i + 1);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  if (!round) {
    return (
      <section className="border border-violet bg-bg p-6 sm:p-10">
        <p className="font-mono text-sm tracking-wider text-accent uppercase">Lesson {lesson} challenge</p>
        <h1 className="mt-2 text-5xl font-semibold">{title} challenge</h1>
        {mode === "member" ? (
          <p className="mt-4 max-w-prose text-lg text-dim">
            Attempt {attemptNo} of {MAX_ATTEMPTS}. Each answer is saved as soon as you pick it and can&apos;t be
            changed. Your best attempt counts on the leaderboard.
          </p>
        ) : (
          <p className="mt-4 max-w-prose text-lg text-dim">
            Guest mode: try the questions as often as you like. Nothing is saved, and it doesn&apos;t count on the
            leaderboard.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 border border-[#ffb38a] px-3.5 py-3">
            {error}
          </p>
        )}
        <button type="button" onClick={start} disabled={busy} className="cta cta--lg mt-6 disabled:opacity-60">
          {busy ? "Loading" : resuming ? `Continue attempt ${attemptNo}` : mode === "member" ? `Start attempt ${attemptNo}` : "Start quiz"}
        </button>
      </section>
    );
  }

  const total = round.questions.length;
  const score = feedback.filter((f) => f?.correct).length;

  if (index >= total) {
    return (
      <section className="border border-violet bg-bg p-6 sm:p-10">
        <p className="font-mono text-sm tracking-wider text-accent uppercase">Mission complete</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-5xl font-semibold outline-none">
          You scored {score} / {total}
        </h1>
        <p className="mt-3 text-lg text-dim">
          {score === total ? "A perfect landing!" : score >= total * 0.7 ? "Nice flying." : "Have another go."}
        </p>
        <p className="mt-2 font-mono text-sm text-dim" role="status">
          {round.mode === "member" ? "Saved. Your best attempt counts on the leaderboard." : "Guest mode: this score isn't saved."}
        </p>
        <ol className="mt-6 flex flex-col gap-2">
          {round.questions.map((question, i) => {
            const f = feedback[i];
            return (
              <li key={question.id} className="border border-grid p-4 text-base">
                <p className="font-medium">
                  <span className={f?.correct ? "text-accent" : "text-[#ffb38a]"}>{f?.correct ? "✓" : "✗"}</span>{" "}
                  {question.question}
                </p>
                {f && !f.correct && (
                  <p className="mt-1 text-dim">
                    Answer: <span className="text-ink">{f.answer}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {round.mode === "member" ? (
            // The page shows the saved record and, if there is one left, the extra attempt.
            <button type="button" onClick={() => router.refresh()} className="cta">
              See my record
            </button>
          ) : (
            <button type="button" onClick={start} className="cta">
              Try another set
            </button>
          )}
          <Link href="/practice" className="font-mono text-xs tracking-wider text-dim uppercase hover:text-accent">
            ← Back to Challenge
          </Link>
        </div>
      </section>
    );
  }

  const question = round.questions[index];
  const picked = current?.chosen;

  return (
    <section className="border border-violet bg-bg p-6 sm:p-8">
      <div className="flex justify-between gap-4 font-mono text-sm tracking-wider whitespace-nowrap text-dim uppercase">
        <span>
          <span className="max-sm:hidden">
            {title}
            {round.attemptNo ? ` · Attempt ${round.attemptNo}` : " · Guest"} ·{" "}
          </span>
          Question {index + 1} / {total}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="mt-2 h-2 bg-grid">
        <div className="h-full bg-(--accent-primary) transition-[width]" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-3xl font-semibold outline-none sm:text-4xl">
        {question.question}
      </h1>
      {question.code && (
        <pre className="mt-5 overflow-x-auto border border-grid bg-grid/40 p-5 font-mono text-base sm:text-lg">
          <code>{question.code}</code>
        </pre>
      )}
      {question.preview && (
        <figure className="mt-3">
          <figcaption className="font-mono text-xs tracking-wider text-dim uppercase">What the browser shows</figcaption>
          <iframe
            title="What the browser shows for this code"
            sandbox=""
            srcDoc={question.preview}
            className="mt-1.5 block h-24 w-full border border-grid bg-white"
          />
        </figure>
      )}

      {/* Two answers per row on wider screens, so a question fits without scrolling. */}
      <ul ref={answersRef} className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
        {question.choices.map((choice, ci) => {
          const isAnswer = !!current && choice === current.answer;
          const isPick = choice === picked;
          const isPending = !current && choice === pending;
          let look = "border-violet/60 hover:border-accent hover:bg-violet/10";
          if (isPending) look = "border-accent bg-accent/10";
          if (current) {
            look = isAnswer ? "border-accent bg-accent/15" : isPick ? "border-[#ffb38a] bg-[#ffb38a]/10" : "border-grid opacity-60";
          }
          return (
            <li key={choice} className="flex">
              <button
                type="button"
                disabled={!!current || busy}
                onClick={() => pick(choice)}
                className={`flex w-full items-start gap-4 border px-5 py-4 text-left disabled:cursor-default ${look}`}
              >
                <span className="font-mono text-base text-accent sm:text-lg">{LETTERS[ci]}</span>
                <span className="font-mono text-base whitespace-pre-wrap sm:text-lg">{choice}</span>
                {isPending && <span className="ml-auto shrink-0 font-mono text-xs tracking-wider text-accent uppercase">Checking…</span>}
                {isAnswer && <span className="sr-only">(correct answer)</span>}
                {isPick && !isAnswer && <span className="sr-only">(your answer)</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-4 border border-[#ffb38a] px-3.5 py-3">
          {error}
        </p>
      )}

      {/* Room under the answers so the feedback bar never covers them; sized to the bar below. */}
      {current && <div ref={spacerRef} aria-hidden="true" className="h-40 sm:h-28" />}

      {/* Feedback slides up from the bottom of the screen, so Next is always in view. */}
      <div aria-live="polite">
        {current && (
          <div
            ref={barRef}
            className="quiz-bar fixed inset-x-0 bottom-0 z-30 border-t-4 bg-bg"
            style={{ borderTopColor: current.correct ? "var(--color-accent)" : "#ffb38a" }}
          >
            <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-12">
              <div>
                <p className={`font-display text-2xl font-semibold ${current.correct ? "text-accent" : "text-[#ffb38a]"}`}>
                  {current.correct ? "Correct!" : "Not quite."}
                </p>
                <p className="mt-1 text-lg text-dim">{current.explain}</p>
              </div>
              <button ref={nextRef} type="button" onClick={next} className="cta cta--lg shrink-0">
                {index + 1 === total ? "See my score" : "Next question"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
