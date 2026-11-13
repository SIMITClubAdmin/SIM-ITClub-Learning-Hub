"use client";

import { Cloud, Laptop } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { RepoState } from "./engine/mini-git";
import { gitEngine, useStudio } from "./WebContainerProvider";

const DX = 88;
const R = 13;
const PAD_X = 52;
const HEADER = 44;
const TUNNEL = 76;
const TAG_H = 16;
const TAG_STEP = TAG_H + 4;
/** Push animation timings at 1x; Slow-Mo doubles them. */
const TRAVEL = 1100;
const STAGGER = 260;

const EMERALD = "#10b981";
const VIOLET = "#a855f7";
const CYAN = "#38bdf8";
const AMBER = "#f59e0b";
const LANE_COLORS = [EMERALD, VIOLET, AMBER, CYAN, "#f472b6", "#60a5fa"];

type Tag = { key: string; label: string; color: string; x: number; y: number; stack: number };
type Node = { id: string; x: number; y: number; color: string; merge: boolean };
type Edge = { key: string; d: string; color: string };

function edgePath(px: number, py: number, cx: number, cy: number) {
  const ex = cx - R - 4;
  if (py === cy) return `M ${px + R} ${py} L ${ex} ${cy}`;
  return `M ${px + R * 0.7} ${py + Math.sign(cy - py) * R * 0.7} C ${px + DX * 0.55} ${cy}, ${cx - DX * 0.6} ${cy}, ${ex} ${cy}`;
}

function useLayout(repo: RepoState, shownRemote: Record<string, string>, width: number) {
  return useMemo(() => {
    const headId = gitEngine.headId(repo);
    const localTips = [...Object.values(repo.branches), ...(headId ? [headId] : [])];
    const visible = new Set<string>();
    for (const tip of [...localTips, ...Object.values(repo.remote), ...Object.values(shownRemote)]) {
      for (const id of gitEngine.reachable(repo, tip)) visible.add(id);
    }
    const ids = repo.order.filter((id) => visible.has(id));
    const rank = new Map(ids.map((id, i) => [id, i]));

    // One lane per branch a commit was made on; main always on top.
    const lanes = ["main"];
    const laneOf = new Map<string, number>();
    for (const id of ids) {
      const name = repo.commits[id].branch;
      if (!lanes.includes(name)) lanes.push(name);
      laneOf.set(id, lanes.indexOf(name));
    }
    const laneColor = (lane: number) => LANE_COLORS[lane % LANE_COLORS.length];
    const branchColor = (name: string) => (lanes.includes(name) ? laneColor(lanes.indexOf(name)) : VIOLET);

    // Pointer tags, stacked above the commit they point at.
    const localTagsAt = new Map<string, { key: string; label: string; color: string }[]>();
    const addTag = (map: typeof localTagsAt, id: string, tag: { key: string; label: string; color: string }) => {
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(tag);
    };
    if (repo.detached) addTag(localTagsAt, repo.detached, { key: "HEAD", label: "HEAD", color: CYAN });
    for (const name of Object.keys(repo.branches).sort((a, b) => (a === "main" ? -1 : b === "main" ? 1 : a.localeCompare(b)))) {
      const current = !repo.detached && repo.head === name;
      addTag(localTagsAt, repo.branches[name], { key: `b-${name}`, label: `${name}${current ? "*" : ""}`, color: branchColor(name) });
    }
    const remoteTagsAt = new Map<string, { key: string; label: string; color: string }[]>();
    for (const name of Object.keys(shownRemote).sort()) {
      addTag(remoteTagsAt, shownRemote[name], { key: `r-${name}`, label: `origin/${name}`, color: VIOLET });
    }

    const maxStack = Math.max(1, ...[...localTagsAt.values(), ...remoteTagsAt.values()].map((t) => t.length));
    const tagSpace = maxStack * TAG_STEP + 6;
    const laneGap = Math.max(58, maxStack * TAG_STEP + 2 * R + 14);

    const localLanes = Math.max(1, ...ids.map((id) => (laneOf.get(id) ?? 0) + 1));
    const localY = (lane: number) => HEADER + tagSpace + R + lane * laneGap;
    const tunnelTop = localY(localLanes - 1) + R + 20;
    const remoteTop = tunnelTop + TUNNEL;

    const remoteShown = new Set<string>();
    for (const tip of Object.values(shownRemote)) for (const id of gitEngine.reachable(repo, tip)) remoteShown.add(id);
    const remoteAll = new Set(remoteShown);
    for (const tip of Object.values(repo.remote)) for (const id of gitEngine.reachable(repo, tip)) remoteAll.add(id);
    const remoteLanes = Math.max(1, ...Array.from(remoteAll).map((id) => (laneOf.get(id) ?? 0) + 1));
    const remoteY = (lane: number) => remoteTop + HEADER + tagSpace + R + lane * laneGap;
    const height = remoteY(remoteLanes - 1) + R + 24;

    const xOf = (id: string) => PAD_X + (rank.get(id) ?? 0) * DX;
    const svgWidth = Math.max(width, PAD_X * 2 + Math.max(0, ids.length - 1) * DX + 70);

    const makeNodes = (set: Set<string>, yOf: (lane: number) => number): Node[] =>
      ids
        .filter((id) => set.has(id))
        .map((id) => ({
          id,
          x: xOf(id),
          y: yOf(laneOf.get(id) ?? 0),
          color: laneColor(laneOf.get(id) ?? 0),
          merge: repo.commits[id].parents.length > 1,
        }));
    const localNodes = makeNodes(visible, localY);
    const remoteNodes = makeNodes(remoteShown, remoteY);

    const makeEdges = (nodes: Node[], prefix: string): Edge[] => {
      const at = new Map(nodes.map((n) => [n.id, n]));
      const edges: Edge[] = [];
      for (const child of nodes) {
        for (const parentId of repo.commits[child.id].parents) {
          const parent = at.get(parentId);
          if (!parent) continue;
          edges.push({ key: `${prefix}${parentId}-${child.id}`, d: edgePath(parent.x, parent.y, child.x, child.y), color: child.color });
        }
      }
      return edges;
    };

    const makeTags = (map: typeof localTagsAt, nodes: Node[]): Tag[] => {
      const at = new Map(nodes.map((n) => [n.id, n]));
      const tags: Tag[] = [];
      for (const [id, list] of map) {
        const node = at.get(id);
        if (!node) continue;
        list.forEach((tag, stack) => tags.push({ ...tag, x: node.x, y: node.y, stack }));
      }
      return tags;
    };

    return {
      headId,
      lanes,
      laneOf,
      localY,
      remoteY,
      xOf,
      tunnelTop,
      remoteTop,
      height,
      svgWidth,
      localNodes,
      remoteNodes,
      localEdges: makeEdges(localNodes, "l"),
      remoteEdges: makeEdges(remoteNodes, "r"),
      localTags: makeTags(localTagsAt, localNodes),
      remoteTags: makeTags(remoteTagsAt, remoteNodes),
    };
  }, [repo, shownRemote, width]);
}

function TagShape({ tag }: { tag: Tag }) {
  const w = tag.label.length * 6.4 + 12;
  const y = -R - 8 - tag.stack * TAG_STEP - TAG_H;
  return (
    <g className="gs-move" style={{ transform: `translate(${tag.x}px, ${tag.y}px)` }}>
      {tag.stack === 0 && <line x1={0} y1={-R - 1} x2={0} y2={-R - 8} stroke={tag.color} strokeWidth={1.5} />}
      <g className="gs-tag-in">
        <rect x={-w / 2} y={y} width={w} height={TAG_H} rx={2} fill={`${tag.color}22`} stroke={tag.color} strokeWidth={1} />
        <text x={0} y={y + TAG_H / 2} dy="0.34em" textAnchor="middle" fontSize={10} fontWeight={700} fill={tag.color} className="gs-svg-mono">
          {tag.label}
        </text>
      </g>
    </g>
  );
}

function CommitNode({
  node,
  head,
  selected,
  remote,
  onSelect,
}: {
  node: Node;
  head: boolean;
  selected: boolean;
  remote?: boolean;
  onSelect: (id: string) => void;
}) {
  const onKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(node.id);
    }
  };
  return (
    <g
      className="gs-move gs-node"
      style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
      role="button"
      tabIndex={0}
      aria-label={`${remote ? "GitHub copy of " : ""}commit ${node.id}${head ? ", HEAD" : ""}. Inspect it.`}
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
      onKeyDown={onKey}
    >
      <g className="gs-pop">
        {head && <circle r={R + 6} fill="none" stroke={CYAN} strokeWidth={1.5} strokeDasharray="3 3" className="gs-head-ring" />}
        {selected && <circle r={R + 3.5} fill="none" stroke="#f8fafc" strokeWidth={1.5} />}
        <circle r={R} fill={remote ? "#140c24" : "#0b101e"} stroke={node.color} strokeWidth={2.5} />
        {node.merge && <circle r={R - 4.5} fill="none" stroke={node.color} strokeWidth={1} opacity={0.7} />}
        <text textAnchor="middle" dy="0.35em" fontSize={10} fontWeight={700} fill="#f8fafc" className="gs-svg-mono">
          {node.id}
        </text>
      </g>
    </g>
  );
}

function Inspector({ repo, id, onGitHub }: { repo: RepoState; id: string; onGitHub: boolean }) {
  const commit = repo.commits[id];
  const parentTree = commit.parents[0] ? repo.commits[commit.parents[0]].files : {};
  const changes = Array.from(new Set([...Object.keys(parentTree), ...Object.keys(commit.files)]))
    .sort()
    .filter((path) => parentTree[path] !== commit.files[path])
    .map((path) => ({ path, kind: !(path in parentTree) ? "A" : !(path in commit.files) ? "D" : "M" }));
  const time = new Date(commit.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div className="grid gap-x-6 gap-y-1.5 border-t border-[#152238] bg-[#0b101e] px-4 py-3 font-mono text-[11px] sm:grid-cols-[auto_1fr]">
      <p className="text-[#64748b] uppercase">Inspecting</p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold text-[#38bdf8]">{commit.id}</span>
        <span className="text-[#f59e0b]">{commit.sha.slice(0, 7)}</span>
        <span className="text-[#f8fafc]">“{commit.message.split("\n")[0]}”</span>
        <span className={onGitHub ? "text-[#10b981]" : "text-[#f59e0b]"}>{onGitHub ? "✓ on GitHub" : "⚠ local only"}</span>
      </p>
      <p className="text-[#64748b] uppercase">Parent</p>
      <p className="text-[#cbd5e1]">
        {commit.parents.length ? commit.parents.join(" + ") : "none (root commit)"}
        <span className="text-[#475569]"> · {time} · {commit.author.replace(/ <.*>$/, "")} · branch {commit.branch}</span>
      </p>
      <p className="text-[#64748b] uppercase">Files</p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-[#cbd5e1]">
        {changes.length === 0 && <span className="text-[#475569]">no file changes</span>}
        {changes.map((c) => (
          <span key={c.path}>
            <span className={c.kind === "A" ? "text-[#10b981]" : c.kind === "D" ? "text-[#f87171]" : "text-[#f59e0b]"}>{c.kind}</span> {c.path}
          </span>
        ))}
        <span className="text-[#475569]">· snapshot holds {Object.keys(commit.files).length} files</span>
      </p>
      <p className="text-[#64748b] uppercase">SHA</p>
      <p className="truncate text-[#475569]">{commit.sha}</p>
    </div>
  );
}

export function GitDagVisualizer() {
  const { repo, pushEvent, finishPush, speed } = useStudio();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [pick, setPick] = useState<{ id: string; head: string | null } | null>(null);
  const slow = speed === 0.5 ? 2 : 1;
  const shownRemote = pushEvent ? pushEvent.prevRemote : repo.remote;
  const view = useLayout(repo, shownRemote, width);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Remote nodes pop in only after the capsules have landed. With reduced motion the capsules
  // fade in place instead of travelling, so the timing stays the same.
  useEffect(() => {
    if (!pushEvent) return;
    const total = ((pushEvent.commits.length - 1) * STAGGER + TRAVEL) * slow + 150;
    const timer = setTimeout(() => finishPush(pushEvent.id), total);
    return () => clearTimeout(timer);
  }, [pushEvent, finishPush, slow]);

  const headId = view.headId;
  const selected = pick && pick.head === headId && repo.commits[pick.id] ? pick.id : headId;
  const select = (id: string) => setPick({ id, head: headId });
  const unpushed = gitEngine.unpushedCount({ ...repo, remote: shownRemote });
  const remoteHas = new Set<string>();
  for (const tip of Object.values(shownRemote)) for (const id of gitEngine.reachable(repo, tip)) remoteHas.add(id);
  const pushBranch = pushEvent?.branch ?? (repo.detached ? "main" : repo.head);

  const capsules = pushEvent
    ? pushEvent.commits
        .filter((id) => view.laneOf.has(id))
        .map((id, i) => {
          const lane = view.laneOf.get(id) ?? 0;
          const from = view.localY(lane);
          const to = view.remoteY(lane);
          return { id, x: view.xOf(id), from, dy: to - from, mid: view.tunnelTop + TUNNEL / 2 - from, delay: i * STAGGER * slow };
        })
    : [];

  return (
    <div className="flex min-w-0 flex-col">
      <div ref={wrapRef} className="relative min-w-0">
        <div className="overflow-x-auto">
          <svg width={view.svgWidth} height={view.height} className="block" role="group" aria-label="Commit graph: your local repository above, GitHub below">
            <defs>
              <marker id="gs-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              <filter id="gs-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="gs-tunnel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={EMERALD} stopOpacity="0.06" />
                <stop offset="0.5" stopColor={CYAN} stopOpacity="0.08" />
                <stop offset="1" stopColor={VIOLET} stopOpacity="0.07" />
              </linearGradient>
            </defs>

            {/* Zones */}
            <rect x={0} y={0} width={view.svgWidth} height={view.tunnelTop} fill={EMERALD} fillOpacity={0.025} />
            <rect x={0} y={view.tunnelTop} width={view.svgWidth} height={TUNNEL} fill="url(#gs-tunnel)" />
            <line x1={0} x2={view.svgWidth} y1={view.tunnelTop} y2={view.tunnelTop} stroke="#1e3a5f" strokeDasharray="6 5" />
            <line x1={0} x2={view.svgWidth} y1={view.remoteTop} y2={view.remoteTop} stroke="#1e3a5f" strokeDasharray="6 5" />
            <rect x={0} y={view.remoteTop} width={view.svgWidth} height={view.height - view.remoteTop} fill={VIOLET} fillOpacity={0.035} />

            {/* Tunnel data lanes while pushing */}
            {capsules.map((c) => (
              <g key={`lane-${pushEvent?.id}-${c.id}`}>
                <line
                  x1={c.x}
                  x2={c.x}
                  y1={view.tunnelTop + 4}
                  y2={view.remoteTop - 4}
                  stroke={CYAN}
                  strokeWidth={2}
                  strokeDasharray="4 6"
                  className="gs-stream"
                  style={{ animationDuration: `${600 * slow}ms` }}
                />
                {[0, 1, 2].map((k) => (
                  <circle
                    key={k}
                    cx={c.x}
                    cy={view.tunnelTop + 6}
                    r={3}
                    fill={k % 2 ? EMERALD : CYAN}
                    filter="url(#gs-glow)"
                    className="gs-data-dot"
                    style={{ "--gs-dy": `${TUNNEL - 12}px`, animationDuration: `${700 * slow}ms`, animationDelay: `${c.delay + k * 220 * slow}ms` } as CSSProperties}
                  />
                ))}
              </g>
            ))}

            {/* Local repository */}
            {view.localEdges.map((e) => (
              <path key={e.key} d={e.d} fill="none" stroke={e.color} strokeOpacity={0.55} strokeWidth={2} markerEnd="url(#gs-arrow)" className="gs-edge" />
            ))}
            {view.localNodes.map((n) => (
              <CommitNode key={n.id} node={n} head={n.id === headId} selected={n.id === selected} onSelect={select} />
            ))}
            {view.localTags.map((t) => (
              <TagShape key={t.key} tag={t} />
            ))}

            {/* GitHub */}
            {view.remoteEdges.map((e) => (
              <path key={e.key} d={e.d} fill="none" stroke={VIOLET} strokeOpacity={0.5} strokeWidth={2} markerEnd="url(#gs-arrow)" className="gs-edge" />
            ))}
            {view.remoteNodes.map((n) => (
              <CommitNode key={`r-${n.id}`} node={{ ...n, color: VIOLET }} head={false} selected={n.id === selected} remote onSelect={select} />
            ))}
            {view.remoteTags.map((t) => (
              <TagShape key={t.key} tag={t} />
            ))}

            {/* Payload capsules travelling Local -> GitHub */}
            {capsules.map((c) => (
              <g key={`cap-${pushEvent?.id}-${c.id}`} style={{ transform: `translate(${c.x}px, ${c.from}px)` }} aria-hidden="true">
                <g
                  className="gs-capsule"
                  style={{ "--gs-dy": `${c.dy}px`, "--gs-mid": `${c.mid}px`, animationDuration: `${TRAVEL * slow}ms`, animationDelay: `${c.delay}ms` } as CSSProperties}
                >
                  <rect x={-30} y={-11} width={60} height={22} rx={11} fill="#0f243c" stroke={CYAN} strokeWidth={1.5} filter="url(#gs-glow)" />
                  <text textAnchor="middle" dy="0.35em" fontSize={10.5} fontWeight={700} fill="#e0f2fe" className="gs-svg-mono">
                    📦 {c.id}
                  </text>
                </g>
              </g>
            ))}
          </svg>
        </div>

        {/* Zone headers sit over the graph but do not scroll with it. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-4 py-3">
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-[#10b981] uppercase">
            <Laptop className="size-4" aria-hidden="true" /> Local repository <span className="font-normal text-[#64748b]">· your machine</span>
          </p>
          <p className="rounded-sm border border-[#1e3a5f] bg-[#070b14]/90 px-2 py-0.5 font-mono text-[11px] text-[#94a3b8]">
            HEAD → <span className={repo.detached ? "text-[#f59e0b]" : "text-[#10b981]"}>{repo.detached ? `detached @ ${repo.detached}` : repo.head}</span>
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center px-4" style={{ top: view.tunnelTop, height: TUNNEL }}>
          <p
            className={`rounded-sm border bg-[#070b14]/90 px-3 py-1 font-mono text-[10.5px] tracking-wider uppercase ${
              pushEvent ? "gs-blink border-[#38bdf8]/70 text-[#38bdf8]" : "border-[#152238] text-[#475569]"
            }`}
          >
            {pushEvent
              ? `⇣ HTTPS · sending ${pushEvent.commits.length} commit${pushEvent.commits.length === 1 ? "" : "s"} · git push origin ${pushBranch}`
              : `HTTPS / SSH network tunnel · git push origin ${pushBranch}`}
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-between gap-3 px-4 py-3" style={{ top: view.remoteTop }}>
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-[#a855f7] uppercase">
            <Cloud className="size-4" aria-hidden="true" /> Remote · GitHub <span className="font-normal text-[#64748b]">(origin)</span>
          </p>
          <p
            role="status"
            className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] font-bold ${
              unpushed ? "border-[#f59e0b]/60 bg-[#f59e0b]/10 text-[#f59e0b]" : "border-[#10b981]/60 bg-[#10b981]/10 text-[#10b981]"
            }`}
          >
            {unpushed ? `⚠ ${unpushed} Commit${unpushed === 1 ? "" : "s"} Ahead (Unpushed)` : "✓ Synced with GitHub"}
          </p>
        </div>
      </div>

      {selected && repo.commits[selected] && <Inspector repo={repo} id={selected} onGitHub={remoteHas.has(selected)} />}
    </div>
  );
}
