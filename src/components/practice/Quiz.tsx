"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { saveQuizResult } from "@/app/practice/actions";
import type { Quiz as QuizData, QuizQuestion } from "@/lib/quizzes";
import { useClubAccount } from "@/lib/use-club-account";
import { useSfx } from "@/lib/use-sfx";

type Round = { question: QuizQuestion; choices: string[]; answer: string }[];

function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A new random order of questions, and of choices inside each question. */
function newRound(quiz: QuizData): Round {
  return shuffle(quiz.questions).map((question) => ({
    question,
    choices: shuffle(question.choices),
    answer: question.choices[0],
  }));
}

const LETTERS = ["A", "B", "C", "D"];

type SaveState = { state: "idle" | "saving" | "saved" } | { state: "error"; error: string };

export function Quiz({ quiz, slug }: { quiz: QuizData; slug: string }) {
  // Shuffled only when the member presses Start, so server and client render the same first screen.
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [save, setSave] = useState<SaveState>({ state: "idle" });
  // Guests aren't on the leaderboard, so their save message doesn't mention it.
  const clubAccount = useClubAccount();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const answersRef = useRef<HTMLUListElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const hasAnswered = round !== null && picks[index] !== undefined;
  const { play } = useSfx();

  // Once the feedback bar appears: keep every answer visible above it, and move keyboard focus to Next.
  useEffect(() => {
    if (!hasAnswered) return;
    const answers = answersRef.current?.getBoundingClientRect();
    // The bar is still sliding in, so use its height rather than where it is right now.
    const barHeight = barRef.current?.offsetHeight;
    if (spacerRef.current && barHeight) spacerRef.current.style.height = `${barHeight + 16}px`;
    if (answers && barHeight) {
      const barTop = window.innerHeight - barHeight;
      if (answers.bottom > barTop - 16) {
        window.scrollBy({ top: answers.bottom - barTop + 16, behavior: "smooth" });
      }
    }
    nextRef.current?.focus({ preventScroll: true });
  }, [hasAnswered, index]);

  function start() {
    play("click");
    setRound(newRound(quiz));
    setIndex(0);
    setPicks([]);
    setSave({ state: "idle" });
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function pick(choice: string) {
    if (round) play(choice === round[index].answer ? "correct" : "wrong");
    setPicks((p) => [...p.slice(0, index), choice]);
  }

  /** Sends the answers to the server, which grades them and saves the score. */
  async function saveScore() {
    if (!round) return;
    setSave({ state: "saving" });
    const answers = Object.fromEntries(round.map((item, i) => [item.question.question, picks[i]]));
    const result = await saveQuizResult(slug, answers);
    setSave(result.ok ? { state: "saved" } : { state: "error", error: result.error });
  }

  function next() {
    play("click");
    if (index + 1 === quiz.questions.length) void saveScore();
    setIndex((i) => i + 1);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  const total = quiz.questions.length;

  if (!round) {
    return (
      <section className="border border-violet bg-bg p-6 sm:p-10">
        <p className="font-mono text-sm tracking-wider text-accent uppercase">Lesson {quiz.lesson} mission</p>
        <h1 className="mt-2 text-5xl font-semibold">{quiz.title} quiz</h1>
        <p className="mt-4 max-w-prose text-lg text-dim">
          {total} multiple-choice questions on {quiz.title}. The questions and answers come in a different order
          every time you start.
        </p>
        <button type="button" onClick={start} className="cta cta--lg mt-6">
          Start quiz
        </button>
      </section>
    );
  }

  const score = round.filter((item, i) => picks[i] === item.answer).length;

  if (index >= round.length) {
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
          {save.state === "saving" && "Saving your score…"}
          {save.state === "saved" &&
            (clubAccount ? "Score saved. Your best score counts towards the leaderboard." : "Score saved.")}
          {save.state === "error" && (
            <>
              <span className="text-[#ffb38a]">{save.error}</span>{" "}
              <button type="button" onClick={saveScore} className="text-ink underline underline-offset-4">
                Try saving again
              </button>
            </>
          )}
        </p>
        <ol className="mt-6 flex flex-col gap-2">
          {round.map((item, i) => {
            const right = picks[i] === item.answer;
            return (
              <li key={item.question.question} className="border border-grid p-4 text-base">
                <p className="font-medium">
                  <span className={right ? "text-accent" : "text-[#ffb38a]"}>{right ? "✓" : "✗"}</span>{" "}
                  {item.question.question}
                </p>
                {!right && (
                  <p className="mt-1 text-dim">
                    Answer: <span className="text-ink">{item.answer}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" onClick={start} className="cta">
            Try again
          </button>
          <Link href="/practice" className="font-mono text-xs tracking-wider text-dim uppercase hover:text-accent">
            ← Back to Practice
          </Link>
        </div>
      </section>
    );
  }

  const item = round[index];
  const picked = picks[index];
  const answered = picked !== undefined;

  return (
    <section className="border border-violet bg-bg p-6 sm:p-8">
      <div className="flex justify-between gap-4 font-mono text-sm tracking-wider whitespace-nowrap text-dim uppercase">
        <span>
          <span className="max-sm:hidden">{quiz.title} · </span>Question {index + 1} / {total}
        </span>
        <span>Score {score}</span>
      </div>
      <div className="mt-2 h-2 bg-grid">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-3xl font-semibold outline-none sm:text-4xl">
        {item.question.question}
      </h1>
      {item.question.code && (
        <pre className="mt-5 overflow-x-auto border border-grid bg-grid/40 p-5 font-mono text-base sm:text-lg">
          <code>{item.question.code}</code>
        </pre>
      )}
      {item.question.preview && (
        <figure className="mt-3">
          <figcaption className="font-mono text-xs tracking-wider text-dim uppercase">What the browser shows</figcaption>
          <iframe
            title="What the browser shows for this code"
            sandbox=""
            srcDoc={item.question.preview}
            className="mt-1.5 block h-24 w-full border border-grid bg-white"
          />
        </figure>
      )}

      {/* Two answers per row on wider screens, so a question fits without scrolling. */}
      <ul ref={answersRef} className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
        {item.choices.map((choice, ci) => {
          const isAnswer = choice === item.answer;
          const isPick = choice === picked;
          let look = "border-violet/60 hover:border-accent hover:bg-violet/10";
          if (answered) {
            look = isAnswer
              ? "border-accent bg-accent/15"
              : isPick
                ? "border-[#ffb38a] bg-[#ffb38a]/10"
                : "border-grid opacity-60";
          }
          return (
            <li key={choice} className="flex">
              <button
                type="button"
                disabled={answered}
                onClick={() => pick(choice)}
                className={`flex w-full items-start gap-4 border px-5 py-4 text-left ${look}`}
              >
                <span className="font-mono text-base text-accent sm:text-lg">{LETTERS[ci]}</span>
                <span className="font-mono text-base whitespace-pre-wrap sm:text-lg">{choice}</span>
                {answered && isAnswer && <span className="sr-only">(correct answer)</span>}
                {answered && isPick && !isAnswer && <span className="sr-only">(your answer)</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Room under the answers so the feedback bar never covers them; sized to the bar below. */}
      {answered && <div ref={spacerRef} aria-hidden="true" className="h-40 sm:h-28" />}

      {/* Feedback slides up from the bottom of the screen, so Next is always in view. */}
      <div aria-live="polite">
        {answered && (
          <div
            ref={barRef}
            className="quiz-bar fixed inset-x-0 bottom-0 z-30 border-t-4 bg-bg"
            style={{ borderTopColor: picked === item.answer ? "var(--color-accent)" : "#ffb38a" }}
          >
            <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-12">
              <div>
                <p
                  className={`font-display text-2xl font-semibold ${picked === item.answer ? "text-accent" : "text-[#ffb38a]"}`}
                >
                  {picked === item.answer ? "Correct!" : "Not quite."}
                </p>
                <p className="mt-1 text-lg text-dim">{item.question.explain}</p>
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
