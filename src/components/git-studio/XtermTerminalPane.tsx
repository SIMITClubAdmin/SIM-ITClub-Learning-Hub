"use client";

import "@xterm/xterm/css/xterm.css";
import type { WebContainerProcess } from "@webcontainer/api";
import type { FitAddon } from "@xterm/addon-fit";
import type { ITheme, Terminal } from "@xterm/xterm";
import { Square, SquareTerminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppearance } from "@/lib/appearance";
import { caretMoved, registerCaret } from "@/lib/cursor-caret";
import type { PaletteId } from "@/lib/appearance-config";
import { cmdState, gateTitle, GatedCmd, useGate, type CmdState } from "./activity-gate";
import { quoteMessage, stripAnsi, useStudio } from "./WebContainerProvider";

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

/** xterm.js draws its own colours, so each site palette gets a matching terminal palette. */
const TERMINAL_THEMES: Record<PaletteId, ITheme> = {
  navy: { ...DARK_ANSI, background: "#05081a", cursor: "#4fd8eb", cursorAccent: "#05081a", selectionBackground: "#1e3a5f" },
  matrix: { ...DARK_ANSI, foreground: "#dcfce7", background: "#020503", cursor: "#22c55e", cursorAccent: "#020503", selectionBackground: "#14532d" },
  sakura: { ...DARK_ANSI, foreground: "#fdf2f8", background: "#0b0510", cursor: "#f472b6", cursorAccent: "#0b0510", selectionBackground: "#4a1d3a" },
  winter: { ...DARK_ANSI, foreground: "#f0f9ff", background: "#040a14", cursor: "#38bdf8", cursorAccent: "#040a14", selectionBackground: "#1e3a5f" },
  "purple-dark": { ...DARK_ANSI, background: "#09080f", cursor: "#a855f7", cursorAccent: "#09080f", selectionBackground: "#3b2a63" },
  "red-dark": { ...DARK_ANSI, background: "#0a0607", cursor: "#ef4444", cursorAccent: "#0a0607", selectionBackground: "#4c1d24" },
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
const STUDIO_OSC = 7777;

export function XtermTerminalPane() {
  const studio = useStudio();
  const { mode, wc, session, bootMessage, repo, cwd, workspace, commitMessage, runCommand, startDevServer, stopDevServer, serverUrl, devRunning } = studio;
  const { palette } = useAppearance();
  const gate = useGate();
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [ready, setReady] = useState(false);
  const branch = repo ? (repo.detached ? "detached" : repo.head) : "";
  const live = useRef({ studio, palette, branch, cwd });

  useEffect(() => {
    live.current = { studio, palette, branch, cwd };
  });

  // Recolour the terminal when the site palette changes.
  useEffect(() => {
    if (ready && termRef.current) termRef.current.options.theme = TERMINAL_THEMES[palette];
  }, [ready, palette]);

  // Create the xterm.js instance once, after the mono font has loaded so cells measure right.
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | null = null;
    let term: Terminal | null = null;
    let unregisterCaret: (() => void) | null = null;
    let caretWatch: { dispose(): void }[] = [];
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
        theme: TERMINAL_THEMES[live.current.palette],
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

      // Hand the custom cursor the typing caret, so its [ ] frame follows what the student types.
      const t = term;
      const caretRect = () => {
        const screen = host.querySelector(".xterm-screen");
        if (!screen) return null;
        const buffer = t.buffer.active;
        const row = buffer.baseY + buffer.cursorY - buffer.viewportY;
        if (row < 0 || row >= t.rows) return null;
        const r = screen.getBoundingClientRect();
        if (!r.width || !r.height) return null;
        const cellW = r.width / t.cols;
        const cellH = r.height / t.rows;
        return { x: r.left + Math.min(buffer.cursorX, t.cols - 1) * cellW, y: r.top + row * cellH, w: cellW, h: cellH };
      };
      unregisterCaret = registerCaret(host.parentElement ?? host, caretRect);
      caretWatch = [t.onCursorMove(caretMoved), t.onScroll(caretMoved), t.onResize(caretMoved), t.onWriteParsed(caretMoved)];
      setReady(true);
    })();
    return () => {
      disposed = true;
      observer?.disconnect();
      unregisterCaret?.();
      caretWatch.forEach((d) => d.dispose());
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
    disposers.push(
      term.parser.registerOscHandler(STUDIO_OSC, (data) => {
        const cut = data.indexOf(";");
        if (cut > 0) live.current.studio.handleOsc(data.slice(0, cut), data.slice(cut + 1));
        return true;
      }),
    );

    if (mode === "container" && wc) {
      let cancelled = false;
      let shell: WebContainerProcess | null = null;
      // jsh prints the folder above each prompt; follow it so the editor and graph follow cd.
      let tail = "";
      let lastShown = "";
      const watchPrompt = (chunk: string) => {
        tail = (tail + stripAnsi(chunk)).slice(-600);
        const matches = [...tail.matchAll(/(?:^|\n)\s*(~[^\r\n]*?)\s*\r?\n\s*❯/g)];
        // jsh adds a timing after slow commands ("~/itcamp/my-project 2s"): keep only the path.
        const shown = matches.length ? matches[matches.length - 1][1].trim().split(/\s+/)[0] : "";
        if (shown && shown !== lastShown) {
          lastShown = shown;
          live.current.studio.promptCwd(shown);
        }
      };
      (async () => {
        try {
          shell = await wc.spawn("jsh", {
            cwd: workspace.startDir || undefined,
            terminal: { cols: term.cols, rows: term.rows },
            env: { PATH: `${wc.workdir}/.studio/bin:${wc.path}` },
          });
        } catch (error) {
          term.write(`\x1b[31mCould not start the shell: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`);
          return;
        }
        // A reset tears the shell down under us, which rejects its exit promise.
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
                watchPrompt(chunk);
              },
            }),
          )
          .catch(() => {});
        const input = proc.input.getWriter();
        disposers.push(
          term.onData((data) => {
            if (data.includes("\x03")) live.current.studio.onInterrupt();
            void input.write(data);
          }),
        );
        disposers.push(term.onResize(({ cols, rows }) => proc.resize({ cols, rows })));
        unregister = live.current.studio.registerTerminal({
          type: (command) => {
            void input.write(`${command}\r`);
            term.focus();
          },
          note: (text) => {
            term.write(`\r\n${text}\r\n`);
            void input.write("\r");
          },
          interrupt: () => void input.write("\x03"),
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

    // Fallback: a small line editor in front of the built-in shell.
    let line = "";
    let busy = false;
    const history: string[] = [];
    let cursor = 0;
    const prompt = () => {
      const { cwd: here, branch: b } = live.current;
      return `\x1b[36m~/itcamp${here ? `/${here}` : ""}\x1b[0m${b ? ` \x1b[35m(${b})\x1b[0m` : ""} \x1b[1m$\x1b[0m `;
    };
    const redraw = () => term.write(`\x1b[2K\r${prompt()}${line}`);
    const execute = async (input: string) => {
      const trimmed = input.trim();
      if (trimmed) history.push(trimmed);
      cursor = history.length;
      if (trimmed === "clear") {
        term.clear();
        term.write(`\x1b[2K\r${prompt()}`);
        return;
      }
      busy = true;
      const out = await live.current.studio.runFallback(trimmed);
      busy = false;
      if (out) term.write(out);
      // Let React apply the new folder or branch before the prompt is drawn.
      await new Promise((r) => setTimeout(r, 30));
      term.write(prompt());
    };
    term.write("\x1b[35m● Built-in Git engine\x1b[0m \x1b[2m(WebContainer unavailable here). Type help for the commands it knows.\x1b[0m\r\n");
    term.write(prompt());
    disposers.push(
      term.onData((data) => {
        if (busy) return;
        if (data === "\x1b[A" || data === "\x1b[B") {
          if (!history.length) return;
          cursor = Math.max(0, Math.min(history.length, cursor + (data === "\x1b[A" ? -1 : 1)));
          line = history[cursor] ?? "";
          redraw();
          return;
        }
        if (data === "\x03") {
          live.current.studio.onInterrupt();
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
            void execute(current);
            return;
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
    unregister = live.current.studio.registerTerminal({
      type: (command) => {
        if (busy) return;
        term.write(`\x1b[2K\r${prompt()}${command}\r\n`);
        line = "";
        void execute(command);
        term.focus();
      },
      note: (text) => {
        term.write(`\x1b[2K\r${text}\r\n${prompt()}${line}`);
      },
      interrupt: () => {},
    });
    return () => {
      disposers.forEach((d) => d.dispose());
      unregister?.();
    };
  }, [ready, mode, wc, session, workspace.startDir]);

  const on = mode !== "booting";
  const serverOn = Boolean(serverUrl) || devRunning;
  // In Activities 1 and 2 the toolbar holds the activity's own commands, each open only during its step.
  const helpers: { label: string; run: () => void; state: CmdState; title?: string }[] = gate
    ? gate.commands.map((cmd) => ({ label: cmd, run: () => void runCommand(cmd), state: cmdState(gate, cmd), title: gateTitle(gate, cmd) }))
    : [
        { label: "git status", run: () => void runCommand("git status"), state: "ready" },
        { label: "git add .", run: () => void runCommand("git add ."), state: "ready" },
        { label: "git commit", run: () => void runCommand(`git commit -m ${quoteMessage(commitMessage)}`), state: "ready" },
        { label: "git push", run: () => void runCommand(branch && branch !== "detached" ? `git push origin ${branch}` : "git push"), state: "ready" },
        { label: "git switch -c feat-ui", run: () => void runCommand("git switch -c feat-ui"), state: "ready" },
      ];

  return (
    <div className="flex min-h-0 flex-col border-t border-(--border-subtle)">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-subtle) bg-(--bg-panel) px-4 py-2.5">
        <p className="gs-ui flex items-center gap-2 text-[13px] text-(--text-muted)">
          <SquareTerminal className="size-4 text-(--accent-text)" aria-hidden="true" />
          Terminal
          <span className="text-(--text-faint)">
            · ~/itcamp{cwd ? `/${cwd}` : ""}
            {mode === "fallback" ? " · built-in shell" : ""}
          </span>
        </p>
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label={gate ? "Activity commands, opened one step at a time" : "Helper commands"}>
          {helpers.map((h) => (
            <GatedCmd key={h.label} label={h.label} state={h.state} glow={!!gate} disabled={!on} onRun={h.run} title={h.title} />
          ))}
          {workspace.allowDev &&
            (serverOn ? (
              <button type="button" onClick={stopDevServer} className="gs-stop" title="Terminate npm run dev">
                <Square className="size-3.5 fill-current" aria-hidden="true" /> Stop Server
              </button>
            ) : (
              <button type="button" disabled={!on} onClick={() => void startDevServer()} className="gs-cmd">
                npm run dev
              </button>
            ))}
        </div>
      </div>
      <div className="gs-term relative h-[320px] bg-(--code-bg) px-3 py-2">
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
