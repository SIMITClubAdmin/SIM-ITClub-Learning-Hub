"use client";

import { ChevronDown, ExternalLink, Eye, Maximize2, Minimize2, RefreshCw, Square } from "lucide-react";
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
  const { serverUrl, devLog, devRunning, previewNonce, reloadPreview, startDevServer, stopDevServer, files, mode, workspace } = useStudio();
  const [openChoice, setOpenChoice] = useState<boolean | null>(null);
  const [theater, setTheater] = useState(false);
  const [snapshot, setSnapshot] = useState(files);
  const live = Boolean(serverUrl);
  const running = live || devRunning;
  // Opens by itself the first time a server comes up, until the student chooses.
  const open = openChoice ?? live;
  const big = theater && live;

  // The built-in preview follows edits, but waits for a pause in typing.
  useEffect(() => {
    const timer = setTimeout(() => setSnapshot(files), 500);
    return () => clearTimeout(timer);
  }, [files]);

  // Escape shrinks the theater view.
  useEffect(() => {
    if (!big) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTheater(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [big]);

  if (!workspace.allowDev) return null;

  const fallback = serverUrl === "fallback";
  const shownUrl = fallback ? `http://localhost:${DEV_PORT}/` : serverUrl;

  return (
    <div className="border-t border-(--border-subtle)">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-(--bg-panel) px-4 py-2">
        <button
          type="button"
          onClick={() => setOpenChoice(!open)}
          aria-expanded={open}
          className="gs-ui flex items-center gap-2 text-left text-[13px] text-(--text-muted) hover:text-(--text-main)"
        >
          <Eye className="size-4 text-(--git-modified)" aria-hidden="true" />
          Live preview
          <span className={`gs-badge ${live ? "text-(--git-local)" : devRunning ? "text-(--git-modified)" : "text-(--text-faint)"}`}>
            {live ? `:${DEV_PORT} running` : devRunning ? "starting…" : "STOPPED"}
          </span>
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          {live && (
            <button type="button" onClick={() => setTheater((v) => !v)} aria-pressed={big} className="gs-btn">
              {big ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
              {big ? "Shrink Preview" : "Expand Preview"}
            </button>
          )}
          {running ? (
            <button type="button" onClick={stopDevServer} className="gs-stop" title="Terminate npm run dev">
              <Square className="size-3.5 fill-current" aria-hidden="true" /> Stop Server
            </button>
          ) : (
            <button type="button" disabled={mode === "booting"} onClick={() => void startDevServer()} className="gs-cmd">
              ▶ npm run dev
            </button>
          )}
        </div>
      </div>

      {open && (
        <>
          {big && <div className="gs-theater-backdrop" onClick={() => setTheater(false)} aria-hidden="true" />}
          {/* The same element grows into the theater view, so the running page is not reloaded. */}
          <div className={big ? "gs-theater" : "bg-(--bg-surface)"} role={big ? "dialog" : undefined} aria-label={big ? "Live preview, expanded" : undefined}>
            {live ? (
              <>
                <div className="flex items-center gap-2 border-y border-(--border-subtle) px-4 py-2">
                  <span className="gs-code min-w-0 flex-1 truncate rounded border border-(--border-subtle) bg-(--code-bg) px-2 py-1 text-[13px] text-(--text-muted)">{shownUrl}</span>
                  <button type="button" onClick={reloadPreview} aria-label="Reload preview" className="gs-btn px-2">
                    <RefreshCw className="size-4" aria-hidden="true" />
                  </button>
                  {!fallback && serverUrl && (
                    <a href={serverUrl} target="_blank" rel="noreferrer" aria-label="Open preview in a new tab" className="gs-btn px-2">
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  )}
                  {big && (
                    <>
                      <button type="button" onClick={stopDevServer} className="gs-stop">
                        <Square className="size-3.5 fill-current" aria-hidden="true" /> Stop Server
                      </button>
                      <button type="button" onClick={() => setTheater(false)} className="gs-btn">
                        <Minimize2 className="size-4" aria-hidden="true" /> Shrink Preview
                      </button>
                    </>
                  )}
                </div>
                {fallback ? (
                  <iframe
                    key={previewNonce}
                    title="Portal preview"
                    sandbox="allow-scripts"
                    srcDoc={inlinePage(snapshot)}
                    className={`block w-full bg-white ${big ? "min-h-0 flex-1" : "h-[320px]"}`}
                  />
                ) : (
                  <iframe
                    key={previewNonce}
                    title="Portal preview from the WebContainer dev server"
                    src={serverUrl ?? undefined}
                    allow="cross-origin-isolated"
                    className={`block w-full bg-white ${big ? "min-h-0 flex-1" : "h-[320px]"}`}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-start gap-3 border-t border-(--border-subtle) px-5 py-5">
                <p className="text-sm text-(--text-muted)">No dev server yet. Start one and the running portal appears here, reloading as you edit.</p>
              </div>
            )}
            {devLog && !big && (
              <pre className="gs-code max-h-28 overflow-auto border-t border-(--border-subtle) bg-(--code-bg) px-4 py-2 text-xs leading-5 text-(--text-muted)">{devLog.trim()}</pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
