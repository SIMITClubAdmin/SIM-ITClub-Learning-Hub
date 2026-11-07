"use client";

import { useState } from "react";

type Props = {
  starter: string;
  task: string;
};

/** Small editor with a live preview. The preview is sandboxed, so scripts never run. */
export function TryIt({ starter, task }: Props) {
  const [code, setCode] = useState(starter);

  return (
    <section aria-labelledby="try-it" className="border border-violet bg-bg/90">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet px-4 py-3">
        <h3 id="try-it" className="font-mono text-xs tracking-wider text-accent uppercase">
          Try it
        </h3>
        <button
          type="button"
          onClick={() => setCode(starter)}
          className="border border-ink px-3 py-1 text-sm transition-colors hover:border-accent hover:bg-accent hover:text-bg"
        >
          Reset
        </button>
      </div>
      <p className="px-4 pt-3 text-sm text-dim">{task}</p>
      <div className="grid gap-px p-4 md:grid-cols-2 md:gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-dim">Your code</span>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={12}
            className="w-full resize-y border border-violet bg-[#05081a] p-3 font-mono text-sm leading-relaxed text-ink"
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-dim">What the browser shows</span>
          <iframe
            title="Preview of your code"
            sandbox=""
            srcDoc={code}
            className="min-h-64 w-full flex-1 border border-violet bg-white"
          />
        </div>
      </div>
    </section>
  );
}
