"use client";

import "@xterm/xterm/css/xterm.css";
import type { WebContainerProcess } from "@webcontainer/api";
import type { FitAddon } from "@xterm/addon-fit";
import type { Terminal } from "@xterm/xterm";
import { SquareTerminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { quoteMessage, useStudio } from "./WebContainerProvider";

const THEME = {
  background: "#05080f",
  foreground: "#cbd5e1",
  cursor: "#38bdf8",
  cursorAccent: "#05080f",
  selectionBackground: "#1e3a5f",
  black: "#0b101e",
  red: "#f87171",
  green: "#10b981",
  yellow: "#f59e0b",
  blue: "#60a5fa",
  magenta: "#a855f7",
  cyan: "#38bdf8",
  white: "#e2e8f0",
  brightBlack: "#64748b",
  brightRed: "#fca5a5",
  brightGreen: "#34d399",
  brightYellow: "#fbbf24",
  brightBlue: "#93c5fd",
  brightMagenta: "#c084fc",
  brightCyan: "#7dd3fc",
  brightWhite: "#f8fafc",
};

/** Private OSC id the mounted `git` command prints after every run. */
const SYNC_OSC = 7777;

export function XtermTerminalPane() {
  const studio = useStudio();
  const { mode, wc, bootId, bootMessage, repo, commitMessage, runCommand, startDevServer } = studio;
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [ready, setReady] = useState(false);
  const branch = repo.detached ? "main" : repo.head || "main";
  const branchRef = useRef(branch);
  const studioRef = useRef(studio);

  useEffect(() => {
    branchRef.current = branch;
    studioRef.current = studio;
  });

  // Create the xterm.js instance once, after the mono font has loaded so cells measure right.
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | null = null;
    let term: Terminal | null = null;
    (async () => {
      const [{ Terminal: XTerm }, { FitAddon: Fit }] = await Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]);
      await document.fonts?.ready;
      const host = hostRef.current;
      if (disposed || !host) return;
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains").trim();
      term = new XTerm({
        convertEol: true,
        cursorBlink: true,
        fontFamily: `${family ? `${family}, ` : ""}ui-monospace, Menlo, monospace`,
        fontSize: 12.5,
        lineHeight: 1.2,
        scrollback: 3000,
        theme: THEME,
      });
      const fit = new Fit();
      term.loadAddon(fit);
      term.open(host);
      try {
        fit.fit();
      } catch {
        // Hidden while collapsed; the observer fits it later.
      }
      termRef.current = term;
      fitRef.current = fit;
      observer = new ResizeObserver(() => {
        try {
          fit.fit();
        } catch {
          // Ignore zero-size moments.
        }
      });
      observer.observe(host);
      setReady(true);
    })();
    return () => {
      disposed = true;
      observer?.disconnect();
      term?.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  // Connect the terminal to the WebContainer shell, or to the in-browser fallback shell.
  useEffect(() => {
    const term = termRef.current;
    if (!ready || !term) return;
    term.reset();
    if (mode === "booting") return;

    const disposers: { dispose(): void }[] = [];
    let unregister: (() => void) | null = null;

    if (mode === "container" && wc) {
      let cancelled = false;
      let shell: WebContainerProcess | null = null;
      disposers.push(
        term.parser.registerOscHandler(SYNC_OSC, (data) => {
          if (data === "sync") void studioRef.current.syncFromSandbox();
          return true;
        }),
      );
      (async () => {
        try {
          shell = await wc.spawn("jsh", {
            terminal: { cols: term.cols, rows: term.rows },
            env: { PATH: `${wc.workdir}/.studio/bin:${wc.path}` },
          });
        } catch (error) {
          term.write(`\x1b[31mCould not start the shell: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`);
          return;
        }
        // Reset tears the container down under the shell, which rejects its exit promise.
        shell.exit.catch(() => {});
        if (cancelled) {
          shell.kill();
          return;
        }
        const proc = shell;
        proc.output
          .pipeTo(
            new WritableStream({
              write(chunk) {
                term.write(chunk);
              },
            }),
          )
          .catch(() => {});
        const input = proc.input.getWriter();
        disposers.push(term.onData((data) => void input.write(data)));
        disposers.push(term.onResize(({ cols, rows }) => proc.resize({ cols, rows })));
        unregister = studioRef.current.registerTerminal({
          type: (command) => {
            void input.write(`${command}\r`);
            term.focus();
          },
          note: (text) => {
            term.write(`\r\n${text}\r\n`);
            void input.write("\r");
          },
        });
      })();
      return () => {
        cancelled = true;
        disposers.forEach((d) => d.dispose());
        unregister?.();
        try {
          shell?.kill();
        } catch {
          // The container is already gone.
        }
      };
    }

    // Fallback: a small line editor in front of the shared Git engine.
    let line = "";
    const history: string[] = [];
    let cursor = 0;
    const prompt = () => `\x1b[36m~/portal\x1b[0m \x1b[35m(${branchRef.current})\x1b[0m \x1b[1m$\x1b[0m `;
    const redraw = () => term.write(`\x1b[2K\r${prompt()}${line}`);
    const execute = (input: string) => {
      const trimmed = input.trim();
      if (trimmed) history.push(trimmed);
      cursor = history.length;
      if (trimmed === "clear") {
        term.clear();
        term.write(`\x1b[2K\r${prompt()}`);
        return;
      }
      const out = studioRef.current.runFallback(trimmed);
      if (out) term.write(out);
      term.write(prompt());
    };
    term.write(
      "\x1b[35m● Built-in Git engine\x1b[0m \x1b[2m(WebContainer unavailable here). git, ls, cat and npm run dev all work.\x1b[0m\r\n",
    );
    term.write(prompt());
    disposers.push(
      term.onData((data) => {
        if (data === "\x1b[A" || data === "\x1b[B") {
          if (!history.length) return;
          cursor = Math.max(0, Math.min(history.length, cursor + (data === "\x1b[A" ? -1 : 1)));
          line = history[cursor] ?? "";
          redraw();
          return;
        }
        if (data === "\x03") {
          term.write("^C\r\n");
          line = "";
          term.write(prompt());
          return;
        }
        if (data === "\x0c") {
          term.clear();
          redraw();
          return;
        }
        if (data.startsWith("\x1b")) return;
        for (const ch of data) {
          if (ch === "\r" || ch === "\n") {
            term.write("\r\n");
            const current = line;
            line = "";
            execute(current);
          } else if (ch === "\x7f" || ch === "\b") {
            if (line) {
              line = line.slice(0, -1);
              term.write("\b \b");
            }
          } else if (ch >= " ") {
            line += ch;
            term.write(ch);
          }
        }
      }),
    );
    unregister = studioRef.current.registerTerminal({
      type: (command) => {
        term.write(`\x1b[2K\r${prompt()}${command}\r\n`);
        line = "";
        execute(command);
        term.focus();
      },
      note: (text) => {
        term.write(`\x1b[2K\r${text}\r\n${prompt()}${line}`);
      },
    });
    return () => {
      disposers.forEach((d) => d.dispose());
      unregister?.();
    };
  }, [ready, mode, wc, bootId]);

  const chips: { label: string; run: () => void; tone: string }[] = [
    { label: "git status", run: () => void runCommand("git status"), tone: "text-[#cbd5e1]" },
    { label: "1. git add .", run: () => void runCommand("git add ."), tone: "text-[#10b981]" },
    {
      label: "2. git commit",
      run: () => void runCommand(`git commit -m ${quoteMessage(commitMessage)}`),
      tone: "text-[#10b981]",
    },
    { label: "3. git push", run: () => void runCommand(`git push origin ${branch}`), tone: "text-[#a855f7]" },
    { label: "git checkout -b feat-ui", run: () => void runCommand("git checkout -b feat-ui"), tone: "text-[#a855f7]" },
    { label: "git log --oneline --all", run: () => void runCommand("git log --oneline --all"), tone: "text-[#cbd5e1]" },
    { label: "npm run dev", run: () => void startDevServer(), tone: "text-[#f59e0b]" },
  ];

  const live = mode !== "booting";

  return (
    <div className="flex min-h-0 flex-col border-t border-[#152238]">
      <div className="flex items-center justify-between gap-3 border-b border-[#152238] bg-[#0b101e] px-3 py-2">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-[#94a3b8] uppercase">
          <SquareTerminal className="size-3.5 text-[#38bdf8]" aria-hidden="true" />
          {mode === "container" ? "jsh · webcontainer" : mode === "fallback" ? "studio shell · built-in" : "terminal"}
        </p>
        <p className="font-mono text-[11px] text-[#64748b]">~/portal</p>
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-[#152238] px-3 py-2" role="toolbar" aria-label="Quick commands">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            disabled={!live}
            onClick={chip.run}
            className={`rounded border border-[#1e3a5f] bg-[#0f243c]/60 px-2 py-1 font-mono text-[11px] ${chip.tone} transition-colors hover:border-[#38bdf8] hover:bg-[#0f243c] disabled:opacity-40`}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <div className="gs-term relative h-[280px] bg-[#05080f] px-2 py-1.5">
        <div ref={hostRef} className="h-full w-full" />
        {mode === "booting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#05080f]/90 font-mono text-xs text-[#94a3b8]">
            <span className="gs-spinner" aria-hidden="true" />
            <p role="status">{bootMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
