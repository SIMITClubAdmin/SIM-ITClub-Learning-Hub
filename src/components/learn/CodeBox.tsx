"use client";

import { useState } from "react";

type Props = {
  code: string;
  /** File name or language shown above the code, such as "index.html". */
  label?: string;
  /** A full HTML page to show under the code as the browser would. Scripts never run in it. */
  preview?: string;
  previewHeight?: number;
  /** What the code prints in the console. */
  output?: string;
};

/** Code from the slides with a Copy button, and optionally what the browser shows for it. */
export function CodeBox({ code, label, preview, previewHeight = 160, output }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Older browsers: copy through a hidden text box.
      const box = document.createElement("textarea");
      box.value = code;
      document.body.append(box);
      box.select();
      document.execCommand("copy");
      box.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <figure className="border border-violet bg-bg">
      <div className="flex items-center justify-between gap-3 border-b border-violet py-1.5 pr-1.5 pl-4">
        <figcaption className="font-mono text-xs tracking-wider text-dim uppercase">{label ?? "Code"}</figcaption>
        <button
          type="button"
          onClick={copy}
          className="border border-accent px-3 py-1.5 font-mono text-xs tracking-wider text-accent uppercase transition-colors hover:bg-accent hover:text-bg"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? "Code copied" : ""}
        </span>
      </div>
      <pre className="overflow-x-auto bg-[#05081a] p-4 font-mono text-sm leading-relaxed text-ink sm:text-[0.95rem]">
        <code>{code}</code>
      </pre>
      {preview !== undefined && (
        <div className="border-t border-violet">
          <p className="px-4 py-2 font-mono text-xs tracking-wider text-dim uppercase">Result</p>
          <iframe
            title={`What the browser shows for ${label ?? "this code"}`}
            sandbox=""
            srcDoc={preview}
            className="block w-full bg-white"
            style={{ height: previewHeight }}
          />
        </div>
      )}
      {output !== undefined && (
        <div className="border-t border-violet">
          <p className="px-4 py-2 font-mono text-xs tracking-wider text-dim uppercase">Console output</p>
          <pre className="overflow-x-auto px-4 pb-4 font-mono text-sm text-accent">{output}</pre>
        </div>
      )}
    </figure>
  );
}
