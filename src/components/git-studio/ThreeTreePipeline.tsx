"use client";

import { Archive, ArrowRight, Package, PencilLine } from "lucide-react";
import type { ReactNode } from "react";
import { gitEngine, useStudio } from "./WebContainerProvider";

type Pill = { key: string; text: string; color: string; title?: string };

function Stage({ step, title, label, icon, color, pills, empty }: { step: number; title: string; label: string; icon: ReactNode; color: string; pills: Pill[]; empty: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded border border-(--border-subtle) bg-(--bg-panel) p-3.5 @2xl:p-4">
      <div className="min-w-0">
        <p className="gs-heading flex items-center gap-2 text-[15px] leading-tight font-semibold" style={{ color }}>
          {icon}
          {step}. {title}
        </p>
        <p className="mt-0.5 text-[13px] text-(--text-muted)">{label}</p>
      </div>
      <ul className="flex min-h-8 flex-wrap gap-1.5">
        {pills.length === 0 ? (
          <li className="gs-badge text-(--text-faint)">{empty}</li>
        ) : (
          pills.map((pill) => (
            <li key={pill.key} title={pill.title} className="gs-badge gs-file-in" style={{ color: pill.color }}>
              {pill.text}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-row items-center justify-center gap-1.5 @lg:flex-col @lg:gap-1" aria-hidden="true">
      {/* The command label only shows when the boxes have room to spare. */}
      <span className="gs-code text-xs whitespace-nowrap text-(--accent-soft) @lg:hidden @2xl:inline">{label}</span>
      <ArrowRight className="size-4 rotate-90 text-(--accent-soft) @lg:rotate-0" />
    </div>
  );
}

export function ThreeTreePipeline() {
  const { status, repo, files, folder } = useStudio();

  if (!repo || !status) {
    const loose = Object.keys(files);
    return (
      <div className="@container">
        <div className="flex flex-col gap-2.5 @lg:flex-row @lg:items-stretch">
          <Stage
            step={1}
            title="Working Dir"
            label={`~/itcamp${folder ? `/${folder}` : ""}`}
            color="var(--git-modified)"
            icon={<PencilLine className="size-4 shrink-0" />}
            pills={loose.map((f) => ({ key: f, text: f, color: "var(--text-muted)" }))}
            empty="Empty folder"
          />
          <Arrow label="git add" />
          <Stage step={2} title="Staging Area" label="Packing Box" color="var(--git-local)" icon={<Package className="size-4 shrink-0" />} pills={[]} empty="No repository yet" />
          <Arrow label="git commit" />
          <Stage step={3} title="Local .git" label="Local History" color="var(--accent-soft)" icon={<Archive className="size-4 shrink-0" />} pills={[]} empty="Run git init" />
        </div>
      </div>
    );
  }

  const headId = gitEngine.headId(repo);
  const snapshots = headId ? repo.order.filter((id) => gitEngine.reachable(repo, headId).has(id)).length : 0;

  const working: Pill[] = [
    ...status.conflicted.map((path) => ({ key: `c-${path}`, text: `! ${path}`, color: "var(--git-danger)", title: "Merge conflict" })),
    ...status.unstaged.map((c) => ({ key: `u-${c.path}`, text: `${c.kind === "D" ? "D" : "M"} ${c.path}`, color: "var(--git-modified)", title: c.kind === "D" ? "Deleted" : "Modified" })),
    ...status.untracked.map((path) => ({ key: `n-${path}`, text: `+ ${path}`, color: "var(--git-modified)", title: "New, not tracked yet" })),
  ];
  const staged: Pill[] = status.staged.map((c) => ({ key: c.path, text: `S ${c.path}`, color: "var(--git-local)", title: `Staged (${c.kind === "A" ? "new" : c.kind === "D" ? "deleted" : "modified"})` }));
  const history: Pill[] = headId
    ? [
        { key: "head", text: `${repo.detached ? "HEAD" : repo.head} → ${headId}`, color: "var(--accent-soft)", title: "The branch you are on, and its newest commit" },
        { key: "count", text: `${snapshots} snapshot${snapshots === 1 ? "" : "s"}`, color: "var(--text-muted)" },
      ]
    : [{ key: "unborn", text: `${repo.head} · no commits yet`, color: "var(--text-muted)" }];

  return (
    <div className="@container">
      <div className="flex flex-col gap-2.5 @lg:flex-row @lg:items-stretch">
        <Stage step={1} title="Working Dir" label="Your Sandbox" color="var(--git-modified)" icon={<PencilLine className="size-4 shrink-0" />} pills={working} empty="Clean" />
        <Arrow label="git add" />
        <Stage step={2} title="Staging Area" label="Packing Box" color="var(--git-local)" icon={<Package className="size-4 shrink-0" />} pills={staged} empty="Empty" />
        <Arrow label="git commit" />
        <Stage step={3} title="Local .git" label="Local History" color="var(--accent-soft)" icon={<Archive className="size-4 shrink-0" />} pills={history} empty="Empty" />
      </div>
    </div>
  );
}
