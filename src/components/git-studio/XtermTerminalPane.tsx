"use client";

import "@xterm/xterm/css/xterm.css";
import type { WebContainerProcess } from "@webcontainer/api";
import type { FitAddon } from "@xterm/addon-fit";
import type { ITheme, Terminal } from "@xterm/xterm";
import { SquareTerminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppearance, type ThemeId } from "./appearance";
import { useStudio } from "./WebContainerProvider";

const DARK_ANSI = {
  foreground: "#e2e8f0",
  black: "#1e1b2e",
  red: "#f87171",
  green: "#34d399",
  yellow: "#fbbf24",
  blue: "#60a5fa",
  magenta: "#c084fc",
  cyan: "#38bdf8",
  white: "#e2e8f0",
  brightBlack: "#7c8496",
  brightRed: "#fca5a5",
  brightGreen: "#6ee7b7",
  brightYellow: "#fcd34d",
  brightBlue: "#93c5fd",
  brightMagenta: "#d8b4fe",
  brightCyan: "#7dd3fc",
  brightWhite: "#f8fafc",
};

/** xterm.js draws its own colours, so each page theme gets a matching terminal palette. */
const TERMINAL_THEMES: Record<ThemeId, ITheme> = {
  "purple-dark": {
    ...DARK_ANSI,
    background: "#09080f",
    cursor: "#a855f7",
    cursorAccent: "#09080f",
    selectionBackground: "#3b2a63",
  },
  "red-dark": {
    ...DARK_ANSI,
    background: "#0a0607",
    cursor: "#ef4444",
    cursorAccent: "#0a0607",
    selectionBackground: "#4c1d24",
  },
  // Light: every ANSI colour is darkened, and "white" text becomes slate, so nothing vanishes.
  "purple-light": {
    background: "#fcfbff",
    foreground: "#0f172a",
    cursor: "#7c3aed",
    cursorAccent: "#fcfbff",
    selectionBackground: "#ddd6fe",
    black: "#0f172a",
    red: "#b91c1c",
    green: "#047857",
    yellow: "#b45309",
    blue: "#1d4ed8",
    magenta: "#7c3aed",
    cyan: "#0e7490",
    white: "#334155",
    brightBlack: "#64748b",
    brightRed: "#dc2626",
    brightGreen: "#059669",
    brightYellow: "#c2410c",
    brightBlue: "#2563eb",
    brightMagenta: "#6d28d9",
    brightCyan: "#0891b2",
    brightWhite: "#0f172a",
  },
};

/** Private OSC id the mounted `git` command prints after every run. */
const SYNC_OSC = 7777;

export function XtermTerminalPane() {
  const studio = useStudio();
  const { mode, wc, bootId, bootMessage, repo, runCommand, startDevServer } = studio;
  const { theme } = useAppearance();
  const themeRef = useRef(theme);
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
    themeRef.current = theme;
  });

  // Recolour the terminal when the page theme changes.
  useEffect(() => {
    if (ready && termRef.current) termRef.current.options.theme = TERMINAL_THEMES[theme];
  }, [ready, theme]);

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
        fontSize: 13.5,
        lineHeight: 1.25,
        scrollback: 3000,
        theme: TERMINAL_THEMES[themeRef.current],
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

  // Only helpers the four goal steps do not already offer.
  const helpers: { label: string; run: () => void }[] = [
    { label: "git status", run: () => void runCommand("git status") },
    { label: "git checkout -b feat-ui", run: () => void runCommand("git checkout -b feat-ui") },
    { label: "npm run dev", run: () => void startDevServer() },
  ];

  const live = mode !== "booting";

  return (
    <div className="flex min-h-0 flex-col border-t border-(--border-subtle)">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-subtle) bg-(--bg-panel) px-4 py-2.5">
        <p className="gs-ui flex items-center gap-2 text-[13px] text-(--text-muted)">
          <SquareTerminal className="size-4 text-(--accent-soft)" aria-hidden="true" />
          Terminal
          <span className="text-(--text-faint)">· {mode === "fallback" ? "built-in shell" : "~/portal"}</span>
        </p>
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Helper commands">
          {helpers.map((h) => (
            <button key={h.label} type="button" disabled={!live} onClick={h.run} className="gs-cmd">
              {h.label}
            </button>
          ))}
        </div>
      </div>
      <div className="gs-term relative h-[300px] bg-(--code-bg) px-3 py-2">
        <div ref={hostRef} className="h-full w-full" />
        {mode === "booting" && (
          <div className="gs-ui absolute inset-0 flex flex-col items-center justify-center gap-3 bg-(--code-bg) text-sm text-(--text-muted)">
            <span className="gs-spinner" aria-hidden="true" />
            <p role="status">{bootMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
