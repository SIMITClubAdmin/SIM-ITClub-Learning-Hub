"use client";

import { FileCode } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { EDITOR_FILES, PRESETS, type EditorFile } from "./engine/sandbox-files";
import { useStudio } from "./WebContainerProvider";

type Badge = { tag: string; title: string; className: string };

export function CodeEditorPane() {
  const { files, status, updateFile, flushWrites, commitMessage, setCommitMessage, mode } = useStudio();
  const [active, setActive] = useState<EditorFile>("index.html");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const content = files[active] ?? "";
  const lineCount = Math.max(1, content.split("\n").length);
  const locked = mode === "booting";

  const badgesFor = (path: string): Badge[] => {
    const badges: Badge[] = [];
    if (status.conflicted.includes(path)) {
      badges.push({ tag: "!", title: "Merge conflict: fix the markers, then git add", className: "border-[#f87171]/60 text-[#f87171]" });
      return badges;
    }
    if (status.staged.some((c) => c.path === path)) {
      badges.push({ tag: "S", title: "Staged: in the packing box for the next commit", className: "border-[#10b981]/60 text-[#10b981]" });
    }
    if (status.unstaged.some((c) => c.path === path) || status.untracked.includes(path)) {
      badges.push({ tag: "M", title: "Modified since the last snapshot (not staged)", className: "border-[#f59e0b]/60 text-[#f59e0b]" });
    }
    return badges;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab" || event.shiftKey) return;
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart, selectionEnd } = el;
    const next = `${content.slice(0, selectionStart)}  ${content.slice(selectionEnd)}`;
    updateFile(active, next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 2;
    });
  };

  const activeBadges = badgesFor(active);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-stretch overflow-x-auto border-b border-[#152238] bg-[#0b101e]" role="tablist" aria-label="Project files">
        {EDITOR_FILES.map((path) => {
          const selected = path === active;
          return (
            <button
              key={path}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(path)}
              className={`flex shrink-0 items-center gap-2 border-r border-[#152238] px-3.5 py-2.5 font-mono text-xs transition-colors ${
                selected ? "bg-[#070b14] text-[#f8fafc] shadow-[inset_0_-2px_0_#38bdf8]" : "text-[#94a3b8] hover:text-[#f8fafc]"
              }`}
            >
              <FileCode className="size-3.5 text-[#38bdf8]" aria-hidden="true" />
              {path}
              {!(path in files) && <span className="text-[#f87171]" title="Deleted from the working directory">[D]</span>}
              {badgesFor(path).map((b) => (
                <span key={b.tag} title={b.title} className={`gs-badge-in rounded-sm border px-1 text-[10px] leading-4 font-bold ${b.className}`}>
                  {b.tag}
                </span>
              ))}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#152238] px-3 py-2">
        <span className="mr-1 font-mono text-[10px] tracking-wider text-[#64748b] uppercase">Quick edit</span>
        {PRESETS.map((preset) => {
          const current = files[preset.file] ?? "";
          const applied = preset.apply(current) === current;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={applied || locked}
              onClick={() => {
                updateFile(preset.file, preset.apply(current));
                setActive(preset.file);
              }}
              className="rounded border border-[#1e3a5f] bg-[#0f243c]/60 px-2 py-1 font-mono text-[11px] text-[#38bdf8] transition-colors hover:border-[#38bdf8] hover:bg-[#0f243c] disabled:cursor-default disabled:opacity-40"
              title={applied ? "Already in the file" : `Inserts code into ${preset.file}`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="relative flex h-[300px] bg-[#070b14]">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-11 shrink-0 overflow-hidden border-r border-[#152238] bg-[#0b101e] py-3 pr-2 text-right font-mono text-[12px] leading-5 text-[#334155] select-none"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
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
          className="gs-editor min-w-0 flex-1 resize-none overflow-auto bg-transparent px-3 py-3 font-mono text-[12px] leading-5 whitespace-pre text-[#e2e8f0] caret-[#38bdf8] outline-none selection:bg-[#1e3a5f]"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#152238] bg-[#0b101e] px-3 py-1.5 font-mono text-[11px] text-[#64748b]">
        <span>
          {active} · {lineCount} lines
          {mode === "container" && " · saved into the WebContainer"}
        </span>
        <span>
          {activeBadges.length === 0 && <span className="text-[#475569]">matches HEAD</span>}
          {activeBadges.map((b) => (
            <span key={b.tag} className={`ml-2 ${b.className.split(" ").pop()}`}>
              [{b.tag}] {b.tag === "M" ? "modified vs index" : b.tag === "S" ? "staged" : "conflict"}
            </span>
          ))}
        </span>
      </div>

      <label className="flex items-center gap-2 border-t border-[#152238] bg-[#070b14] px-3 py-2">
        <span className="shrink-0 rounded-sm border border-[#1e3a5f] bg-[#0f243c] px-1.5 py-0.5 font-mono text-[11px] text-[#38bdf8]">
          git commit -m
        </span>
        <input
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          maxLength={72}
          spellCheck={false}
          aria-label="Commit message"
          className="min-w-0 flex-1 rounded-sm border border-[#152238] bg-[#05080f] px-2 py-1 font-mono text-xs text-[#f8fafc] outline-none focus:border-[#38bdf8]"
        />
      </label>
    </div>
  );
}
