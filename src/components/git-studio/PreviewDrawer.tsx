"use client";

import { ChevronDown, ExternalLink, Eye, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { Files } from "./engine/mini-git";
import { DEV_PORT } from "./engine/sandbox-files";
import { useStudio } from "./WebContainerProvider";

/** The fallback preview: index.html with app.js inlined, run in a sandboxed frame. */
function inlinePage(files: Files) {
  const html = files["index.html"] ?? "<p>index.html is missing</p>";
  const js = (files["app.js"] ?? "").replace(/<\/script/gi, "<\\/script");
  return html.replace(/<script\s+src=["']\.?\/?app\.js["']\s*>\s*<\/script>/i, `<script>${js}</script>`);
}

export function PreviewDrawer() {
  const { serverUrl, devLog, devRunning, previewNonce, reloadPreview, startDevServer, files, mode } = useStudio();
  const [openChoice, setOpenChoice] = useState<boolean | null>(null);
  const [snapshot, setSnapshot] = useState(files);
  const live = Boolean(serverUrl);
  // Opens by itself the first time a server comes up, until the student chooses.
  const open = openChoice ?? live;

  // The built-in preview follows edits, but waits for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => setSnapshot(files), 500);
    return () => clearTimeout(timer);
  }, [files]);

  const fallback = serverUrl === "fallback";
  const shownUrl = fallback ? `http://localhost:${DEV_PORT}/` : serverUrl;

  return (
    <div className="border-t border-[#152238]">
      <button
        type="button"
        onClick={() => setOpenChoice(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 bg-[#0b101e] px-3 py-2 text-left font-mono text-[11px] tracking-wider text-[#94a3b8] uppercase hover:text-[#f8fafc]"
      >
        <span className="flex items-center gap-2">
          <Eye className="size-3.5 text-[#f59e0b]" aria-hidden="true" />
          Live preview
          <span
            className={`rounded-sm border px-1.5 py-px text-[10px] ${
              live ? "border-[#10b981]/50 text-[#10b981]" : devRunning ? "border-[#f59e0b]/50 text-[#f59e0b]" : "border-[#334155] text-[#64748b]"
            }`}
          >
            {live ? `:${DEV_PORT} running` : devRunning ? "starting…" : "stopped"}
          </span>
        </span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="bg-[#070b14]">
          {live ? (
            <>
              <div className="flex items-center gap-2 border-y border-[#152238] px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate rounded-sm border border-[#152238] bg-[#05080f] px-2 py-1 font-mono text-[11px] text-[#94a3b8]">
                  {shownUrl}
                </span>
                <button
                  type="button"
                  onClick={reloadPreview}
                  aria-label="Reload preview"
                  className="rounded-sm border border-[#152238] p-1.5 text-[#94a3b8] hover:border-[#38bdf8] hover:text-[#38bdf8]"
                >
                  <RefreshCw className="size-3.5" aria-hidden="true" />
                </button>
                {!fallback && serverUrl && (
                  <a
                    href={serverUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open preview in a new tab"
                    className="rounded-sm border border-[#152238] p-1.5 text-[#94a3b8] hover:border-[#38bdf8] hover:text-[#38bdf8]"
                  >
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
              {fallback ? (
                <iframe
                  key={previewNonce}
                  title="Portal preview"
                  sandbox="allow-scripts"
                  srcDoc={inlinePage(snapshot)}
                  className="block h-[300px] w-full bg-white"
                />
              ) : (
                <iframe
                  key={previewNonce}
                  title="Portal preview from the WebContainer dev server"
                  src={serverUrl ?? undefined}
                  allow="cross-origin-isolated"
                  className="block h-[300px] w-full bg-white"
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-start gap-3 border-t border-[#152238] px-4 py-5">
              <p className="text-sm text-[#94a3b8]">
                No dev server yet. Start one and the running portal appears here, reloading as you edit.
              </p>
              <button
                type="button"
                disabled={mode === "booting" || devRunning}
                onClick={() => void startDevServer()}
                className="rounded border border-[#f59e0b]/60 bg-[#f59e0b]/10 px-3 py-1.5 font-mono text-xs text-[#f59e0b] hover:bg-[#f59e0b]/20 disabled:opacity-40"
              >
                ▶ npm run dev
              </button>
            </div>
          )}
          {devLog && (
            <pre className="max-h-24 overflow-auto border-t border-[#152238] bg-[#05080f] px-3 py-2 font-mono text-[11px] leading-4 text-[#64748b]">
              {devLog.trim()}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
