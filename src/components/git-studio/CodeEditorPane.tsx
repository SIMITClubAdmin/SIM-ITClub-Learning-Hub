"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EDITOR_FILES, PRESETS, type EditorFile } from "./engine/sandbox-files";
import { useStudio } from "./WebContainerProvider";

type Badge = { tag: string; title: string; color: string };

/** "+ Insert preset" menu: ready-made code a student can drop into a file in one click. */
function PresetMenu({ onPick }: { onPick: (file: EditorFile) => void }) {
  const { files, updateFile, mode } = useStudio();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0 px-1">
      <button
        type="button"
        disabled={mode === "booting"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        aria-label="Insert preset code"
        title="Insert preset code"
        className="gs-btn gap-1 border-transparent bg-transparent px-2"
      >
        <Plus className="size-4" aria-hidden="true" />
        <span className="hidden @md:inline">Preset</span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-2 z-20 mt-1 w-64 rounded border border-(--border-subtle) bg-(--bg-surface) p-1 shadow-xl">
          {PRESETS.map((preset) => {
            const current = files[preset.file] ?? "";
            const applied = preset.apply(current) === current;
            return (
              <button
                key={preset.id}
                type="button"
                role="menuitem"
                disabled={applied}
                onClick={() => {
                  updateFile(preset.file, preset.apply(current));
                  onPick(preset.file);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 rounded px-3 py-2 text-left text-sm hover:bg-(--bg-panel) disabled:opacity-45"
              >
                <span className="text-(--text-main)">{preset.label}</span>
                <span className="gs-code text-xs text-(--text-muted)">{applied ? "already added" : `into ${preset.file}`}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CodeEditorPane() {
  const { files, status, updateFile, flushWrites, mode } = useStudio();
  const [active, setActive] = useState<EditorFile>("index.html");
  const gutterRef = useRef<HTMLDivElement>(null);
  const content = files[active] ?? "";
  const lineCount = Math.max(1, content.split("\n").length);
  const locked = mode === "booting";

  const badgesFor = (path: string): Badge[] => {
    if (status.conflicted.includes(path)) return [{ tag: "!", title: "Merge conflict: fix the markers, then git add", color: "text-(--git-danger)" }];
    const badges: Badge[] = [];
    if (status.staged.some((c) => c.path === path)) badges.push({ tag: "S", title: "Staged: in the packing box", color: "text-(--git-local)" });
    if (status.unstaged.some((c) => c.path === path) || status.untracked.includes(path)) {
      badges.push({ tag: "M", title: "Modified since the last commit", color: "text-(--git-modified)" });
    }
    if (!(path in files)) badges.push({ tag: "D", title: "Deleted from the working directory", color: "text-(--git-danger)" });
    return badges;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab" || event.shiftKey) return;
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart, selectionEnd } = el;
    updateFile(active, `${content.slice(0, selectionStart)}  ${content.slice(selectionEnd)}`);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 2;
    });
  };

  return (
    <div className="flex min-h-0 flex-col">
      {/* @container: the preset menu shrinks to an icon when the editor column is narrow. */}
      <div className="@container flex items-stretch justify-between border-b border-(--border-subtle) bg-(--bg-panel)">
        <div className="flex min-w-0 overflow-x-auto" role="tablist" aria-label="Project files">
          {EDITOR_FILES.map((path) => {
            const selected = path === active;
            return (
              <button
                key={path}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(path)}
                className={`gs-code flex shrink-0 items-center gap-2 border-r border-(--border-subtle) px-3 py-3 text-sm transition-colors ${
                  selected ? "bg-(--code-bg) text-(--text-main) shadow-[inset_0_-2px_0_var(--accent-primary)]" : "text-(--text-muted) hover:text-(--text-main)"
                }`}
              >
                {path}
                {badgesFor(path).map((b) => (
                  <span key={b.tag} title={b.title} className={`gs-badge gs-badge-in font-bold ${b.color}`}>
                    {b.tag}
                  </span>
                ))}
              </button>
            );
          })}
        </div>
        <PresetMenu onPick={setActive} />
      </div>

      <div className="relative flex h-[320px] bg-(--code-bg)">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="gs-code w-12 shrink-0 overflow-hidden border-r border-(--border-subtle) py-3 pr-3 text-right text-[13px] leading-6 text-(--text-faint) select-none"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={content}
          readOnly={locked}
          onChange={(e) => updateFile(active, e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => void flushWrites()}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={`Edit ${active}`}
          className="gs-editor gs-code min-w-0 flex-1 resize-none overflow-auto bg-transparent px-4 py-3 text-sm leading-6 whitespace-pre text-(--code-text) caret-(--accent-primary) outline-none"
        />
      </div>
    </div>
  );
}
