"use client";

import { Check, ChevronDown, FilePlus, GitCommitHorizontal, Plus, Save } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PRESETS, TAB_ORDER } from "./engine/sandbox-files";
import { quoteMessage, useStudio } from "./WebContainerProvider";

type Badge = { tag: string; title: string; color: string };

function sortTabs(names: string[]) {
  const rank = (n: string) => {
    const i = TAB_ORDER.indexOf(n);
    return i === -1 ? TAB_ORDER.length : i;
  };
  return [...names].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/** "+ Preset" menu: ready-made code a student can drop into a file in one click. */
function PresetMenu({ onPick }: { onPick: (file: string) => void }) {
  const { files, updateFile, mode } = useStudio();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const available = PRESETS.filter((p) => p.file in files);

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

  if (!available.length) return null;
  return (
    <div ref={rootRef} className="relative shrink-0 px-1">
      <button
        type="button"
        disabled={mode === "booting"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Insert preset code"
        title="Insert preset code"
        onClick={() => setOpen((v) => !v)}
        className="gs-btn gap-1 border-transparent bg-transparent px-2"
      >
        <Plus className="size-4" aria-hidden="true" />
        <span className="hidden @lg:inline">Preset</span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-2 z-20 mt-1 w-64 rounded border border-(--border-subtle) bg-(--bg-surface) p-1 shadow-xl">
          {available.map((preset) => {
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

/** Inline "new file" box in the tab bar. */
function NewFile({ onCreated }: { onCreated: (name: string) => void }) {
  const { createFile, mode } = useStudio();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const problem = await createFile(name);
    if (problem) {
      setError(problem);
      return;
    }
    onCreated(name.trim().replace(/^\.\//, ""));
    setName("");
    setError("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" disabled={mode === "booting"} onClick={() => setOpen(true)} className="gs-btn shrink-0 gap-1 border-transparent bg-transparent px-2.5" title="Create a file in this folder">
        <FilePlus className="size-4" aria-hidden="true" /> <span className="hidden @md:inline">New File</span>
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="flex shrink-0 items-center gap-1.5 px-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="your-name.txt"
        aria-label="New file name"
        aria-invalid={Boolean(error)}
        title={error || undefined}
        className={`gs-code w-36 rounded border bg-(--code-bg) px-2 py-1 text-[13px] text-(--code-text) outline-none ${error ? "border-(--git-danger)" : "border-(--border-subtle) focus:border-(--accent-primary)"}`}
      />
      <button type="submit" className="gs-cmd">
        Create
      </button>
    </form>
  );
}

export function CodeEditorPane() {
  const { files, status, updateFile, saveFile, flushWrites, mode, workspace, folder, repo, commitMessage, setCommitMessage, runCommand } = useStudio();
  const [active, setActive] = useState("");
  const [savedFile, setSavedFile] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const names = sortTabs(Object.keys(files).filter((n) => !workspace.hidden.includes(n)));
  const current = names.includes(active) ? active : (names[0] ?? "");
  const content = files[current] ?? "";
  const lineCount = Math.max(1, content.split("\n").length);
  const locked = mode === "booting" || !current;

  const badgesFor = (path: string): Badge[] => {
    if (!status) return [];
    if (status.conflicted.includes(path)) return [{ tag: "!", title: "Merge conflict: fix the markers, then git add", color: "text-(--git-danger)" }];
    const badges: Badge[] = [];
    if (status.staged.some((c) => c.path === path)) badges.push({ tag: "S", title: "Staged: ready for the next commit", color: "text-(--git-local)" });
    if (status.unstaged.some((c) => c.path === path)) badges.push({ tag: "M", title: "Modified since the last commit", color: "text-(--git-modified)" });
    if (status.untracked.includes(path)) badges.push({ tag: "U", title: "New file Git is not tracking yet", color: "text-(--git-modified)" });
    return badges;
  };

  // Like VS Code: Ctrl+S (Cmd+S on a Mac) or the Save button writes the file straight away.
  // Typing also saves by itself a moment later, so nothing is ever lost.
  const save = async () => {
    if (!current || mode === "booting") return;
    await saveFile(current);
    setSavedFile(current);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedFile(null), 1800);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void save();
      return;
    }
    if (event.key !== "Tab" || event.shiftKey) return;
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart, selectionEnd } = el;
    updateFile(current, `${content.slice(0, selectionStart)}  ${content.slice(selectionEnd)}`);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 2;
    });
  };

  return (
    <div className="flex min-h-0 flex-col">
      {/* @container: the tab bar's buttons shrink to icons when the editor is narrow. */}
      <div className="@container flex items-stretch justify-between border-b border-(--border-subtle) bg-(--bg-panel)">
        <div className="flex min-w-0 overflow-x-auto" role="tablist" aria-label={`Files in ~/itcamp/${folder}`}>
          {names.map((path) => {
            const selected = path === current;
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
          <NewFile onCreated={setActive} />
        </div>
        <div className="flex shrink-0 items-center">
          {current && (
            <button
              type="button"
              disabled={locked}
              onClick={() => void save()}
              className="gs-btn gap-1 border-transparent bg-transparent px-2.5"
              title={`Save ${current} (Ctrl+S)`}
              aria-label={`Save ${current}`}
            >
              {savedFile === current ? <Check className="size-4 text-(--git-local)" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              <span className="hidden @md:inline">{savedFile === current ? "Saved" : "Save"}</span>
            </button>
          )}
          <PresetMenu onPick={setActive} />
        </div>
        <span className="sr-only" role="status">
          {savedFile ? `${savedFile} saved` : ""}
        </span>
      </div>

      {current ? (
        <div className="relative flex h-[340px] bg-(--code-bg)">
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
            onChange={(e) => updateFile(current, e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => void flushWrites()}
            onScroll={(e) => {
              if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
            }}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={`Edit ${current}`}
            className="gs-editor gs-code min-w-0 flex-1 resize-none overflow-auto bg-transparent px-4 py-3 text-sm leading-6 whitespace-pre text-(--code-text) caret-(--accent-primary) outline-none"
          />
        </div>
      ) : (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 bg-(--code-bg) px-6 text-center text-sm text-(--text-muted)">
          <p>
            <span className="gs-code text-(--text-main)">~/itcamp{folder ? `/${folder}` : ""}</span> has no files yet.
          </p>
          <p>
            Click <strong>New File</strong> above, or run <code className="gs-pill">touch your-name.txt</code> in the terminal.
          </p>
        </div>
      )}

      {repo && (
        <form
          className="flex items-center gap-2 border-t border-(--border-subtle) bg-(--bg-panel) px-4 py-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            void runCommand(`git commit -m ${quoteMessage(commitMessage)}`);
          }}
        >
          <GitCommitHorizontal className="size-4 shrink-0 text-(--accent-text)" aria-hidden="true" />
          <label htmlFor="gs-commit-message" className="gs-code shrink-0 text-[13px] text-(--text-muted)">
            git commit -m
          </label>
          <input
            id="gs-commit-message"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            maxLength={72}
            spellCheck={false}
            className="gs-code min-w-0 flex-1 rounded border border-(--border-subtle) bg-(--code-bg) px-2.5 py-1.5 text-[13px] text-(--code-text) outline-none focus:border-(--accent-primary)"
          />
          <button type="submit" disabled={mode === "booting"} className="gs-cmd">
            Commit
          </button>
        </form>
      )}
    </div>
  );
}
