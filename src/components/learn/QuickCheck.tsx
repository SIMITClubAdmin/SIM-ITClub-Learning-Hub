"use client";

import { useId, useState } from "react";

type Props = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

/** One multiple-choice question with instant feedback. Not scored. */
export function QuickCheck({ question, options, answer, explanation }: Props) {
  const name = useId();
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === answer;

  return (
    <fieldset className="border border-violet bg-bg/90 p-5">
      <legend className="px-2 font-mono text-xs tracking-wider text-accent uppercase">Quick check</legend>
      <p className="font-medium">{question}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {options.map((option, i) => (
          <label
            key={option}
            className={`cursor-pointer border px-4 py-2 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent ${
              picked === i
                ? i === answer
                  ? "border-accent bg-accent text-bg"
                  : "border-[#be3caa] bg-[#be3caa]/20"
                : "border-violet hover:border-accent"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={i}
              className="sr-only"
              onChange={() => setPicked(i)}
            />
            {option}
          </label>
        ))}
      </div>
      <p aria-live="polite" className="mt-4 text-sm text-dim">
        {picked === null ? "" : correct ? `Correct! ${explanation}` : "Not quite. Try another answer."}
      </p>
    </fieldset>
  );
}
