"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  starter: string;
  task: string;
  /** Run the JavaScript in the code and show console.log output under the preview. */
  js?: boolean;
};

type LogLine = { kind: "log" | "error"; text: string };

// Put into the preview page (on one line, so error line numbers stay right): sends every
// console.log and error to this component. The preview has no access to the site itself.
const CONSOLE_BRIDGE =
  '<script>(function(){var s=function(k,a){parent.postMessage({tryitLog:{kind:k,text:a.map(function(x){try{return typeof x==="string"?x:JSON.stringify(x)}catch(e){return String(x)}}).join(" ")}},"*")};var l=console.log;console.log=function(){var a=[].slice.call(arguments);s("log",a);l.apply(console,a)};window.addEventListener("error",function(e){s("error",[e.message+(e.lineno?" (line "+e.lineno+")":"")])})})();</script>';

function withBridge(code: string) {
  const at = code.search(/<head[^>]*>/i);
  if (at === -1) return CONSOLE_BRIDGE + code;
  const end = code.indexOf(">", at) + 1;
  return code.slice(0, end) + CONSOLE_BRIDGE + code.slice(end);
}

/**
 * Small editor with a live preview. HTML and CSS previews never run scripts. In JS mode the
 * preview runs the code in a sandbox (no access to this site, cookies or storage) and shows
 * console.log lines below, like a mini DevTools console.
 */
export function TryIt({ starter, task, js = false }: Props) {
  const [code, setCode] = useState(starter);
  // JS re-runs on every change, so wait until typing pauses before running it.
  const [running, setRunning] = useState(starter);
  const [run, setRun] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!js) return;
    const t = setTimeout(() => {
      setLogs([]);
      setRunning(code);
    }, 500);
    return () => clearTimeout(t);
  }, [code, js]);

  useEffect(() => {
    if (!js) return;
    function onMessage(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow) return;
      const line = event.data?.tryitLog as LogLine | undefined;
      if (line && typeof line.text === "string") setLogs((l) => [...l.slice(-49), line]);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [js]);

  function reset() {
    setCode(starter);
    setRunning(starter);
    setLogs([]);
    setRun((n) => n + 1);
  }

  function runAgain() {
    setLogs([]);
    setRunning(code);
    setRun((n) => n + 1);
  }

  return (
    <section className="border border-violet bg-bg/90">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-violet px-4 py-3">
        <h3 className="font-mono text-xs tracking-wider text-accent uppercase">{js ? "Try it · JavaScript runs" : "Try it"}</h3>
        <div className="flex gap-2">
          {js && (
            <button
              type="button"
              onClick={runAgain}
              className="border border-accent px-3 py-1 text-sm text-accent transition-colors hover:bg-accent hover:text-bg"
            >
              Run again
            </button>
          )}
          <button
            type="button"
            onClick={reset}
            className="border border-ink px-3 py-1 text-sm transition-colors hover:border-accent hover:bg-accent hover:text-bg"
          >
            Reset
          </button>
        </div>
      </div>
      <p className="px-4 pt-3 text-sm text-dim">{task}</p>
      <div className="grid gap-px p-4 md:grid-cols-2 md:gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-dim">Your code</span>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={js ? 16 : 12}
            className="w-full resize-y border border-violet bg-[#05081a] p-3 font-mono text-sm leading-relaxed text-ink"
          />
        </label>
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-sm text-dim">What the browser shows</span>
          <iframe
            key={run}
            ref={frame}
            title="Preview of your code"
            sandbox={js ? "allow-scripts" : ""}
            srcDoc={js ? withBridge(running) : code}
            className="min-h-64 w-full flex-1 border border-violet bg-white"
          />
          {js && (
            <div className="border border-violet bg-[#05081a]" aria-live="polite">
              <p className="border-b border-violet/60 px-3 py-1.5 font-mono text-[11px] tracking-wider text-dim uppercase">
                Console
              </p>
              <ol className="max-h-40 overflow-y-auto px-3 py-2 font-mono text-sm">
                {logs.length === 0 && <li className="text-dim">console.log output shows here.</li>}
                {logs.map((line, i) => (
                  <li key={i} className={line.kind === "error" ? "text-[#ffb38a]" : "text-ink"}>
                    {line.kind === "error" ? "✗ " : "› "}
                    {line.text}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
