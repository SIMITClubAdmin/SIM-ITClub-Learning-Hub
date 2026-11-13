"use client";

import { ArrowRight, Archive, Package, PencilLine } from "lucide-react";
import type { ReactNode } from "react";
import { gitEngine, useStudio } from "./WebContainerProvider";

type Row = { path: string; tag: string; tone: string };

function Stage({
  step,
  title,
  subtitle,
  icon,
  accent,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  icon: ReactNode;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded border border-[#152238] bg-[#0b101e]">
      <div className="flex items-center gap-2 border-b border-[#152238] px-3 py-2">
        <span className={accent}>{icon}</span>
        <div className="min-w-0">
          <p className={`font-mono text-[11px] font-bold tracking-wider uppercase ${accent}`}>
            {step}. {title}
          </p>
          <p className="truncate font-mono text-[10px] tracking-wider text-[#64748b] uppercase">{subtitle}</p>
        </div>
      </div>
      <div className="flex min-h-[92px] flex-col gap-1 px-3 py-2.5">{children}</div>
    </div>
  );
}

function FileRows({ rows, empty }: { rows: Row[]; empty: string }) {
  if (!rows.length) return <p className="font-mono text-[11px] text-[#475569]">{empty}</p>;
  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row) => (
        <li key={`${row.tag}-${row.path}`} className={`gs-file-in flex items-center gap-1.5 font-mono text-[11px] ${row.tone}`}>
          <span className="font-bold">[{row.tag}]</span>
          <span className="truncate">{row.path}</span>
        </li>
      ))}
    </ul>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-row items-center justify-center gap-1 py-1 sm:flex-col sm:px-0.5 sm:py-0" aria-hidden="true">
      <span className="font-mono text-[10px] whitespace-nowrap text-[#38bdf8]">{label}</span>
      <ArrowRight className="size-4 rotate-90 text-[#38bdf8] sm:rotate-0" />
    </div>
  );
}

export function ThreeTreePipeline() {
  const { status, repo } = useStudio();
  const headId = gitEngine.headId(repo);
  const head = headId ? repo.commits[headId] : null;

  const working: Row[] = [
    ...status.conflicted.map((path) => ({ path, tag: "!", tone: "text-[#f87171]" })),
    ...status.unstaged.map((c) => ({ path: c.path, tag: c.kind === "D" ? "D" : "M", tone: "text-[#f59e0b]" })),
    ...status.untracked.map((path) => ({ path, tag: "U", tone: "text-[#f59e0b]" })),
  ];
  const staged: Row[] = status.staged.map((c) => ({ path: c.path, tag: c.kind === "M" ? "S" : `S:${c.kind}`, tone: "text-[#10b981]" }));
  const snapshots = repo.order.filter((id) => gitEngine.reachable(repo, headId).has(id)).length;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <Stage step={1} title="Working dir" subtitle="Sandbox · your desk" accent="text-[#f59e0b]" icon={<PencilLine className="size-4" />}>
        <FileRows rows={working} empty="clean · matches the index" />
      </Stage>
      <Arrow label="git add" />
      <Stage step={2} title="Staging area" subtitle="Index · packing box" accent="text-[#10b981]" icon={<Package className="size-4" />}>
        <FileRows rows={staged} empty="empty · run git add" />
      </Stage>
      <Arrow label="git commit" />
      <Stage step={3} title="Local .git" subtitle="HEAD · sealed vault" accent="text-[#38bdf8]" icon={<Archive className="size-4" />}>
        {head && (
          <div className="flex flex-col gap-1 font-mono text-[11px]">
            <p className="text-[#f8fafc]">
              <span className="text-[#64748b]">HEAD → </span>
              <span className={repo.detached ? "text-[#f59e0b]" : "text-[#10b981]"}>{repo.detached ? "detached" : repo.head}</span>
              <span className="text-[#64748b]"> @ </span>
              <span key={head.id} className="gs-file-in inline-block font-bold text-[#38bdf8]">
                {head.id}
              </span>
            </p>
            <p className="text-[#64748b]">sha {head.sha.slice(0, 7)}</p>
            <p className="truncate text-[#94a3b8]" title={head.message}>
              “{head.message.split("\n")[0]}”
            </p>
            <p className="text-[#64748b]">
              {snapshots} snapshot{snapshots === 1 ? "" : "s"} in history
            </p>
          </div>
        )}
      </Stage>
    </div>
  );
}
