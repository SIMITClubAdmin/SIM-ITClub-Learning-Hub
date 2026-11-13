"use client";

import { Cloud, Laptop } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { RepoState } from "./engine/mini-git";
import { gitEngine, useStudio } from "./WebContainerProvider";

/** Widest and narrowest gap between commits; the graph squeezes to fit before it scrolls. */
const DX = 96;
const MIN_DX = 72;
const R = 15;
const PAD_X = 60;
/** Room for each zone's header row above its commits. */
const HEADER = 60;
const TUNNEL = 88;
const TAG_H = 20;
const TAG_STEP = TAG_H + 5;
/** Push animation timings at 1x; Slow-Mo doubles them. */
const TRAVEL = 1100;
const STAGGER = 260;

// Theme colours. SVG presentation attributes do not accept var(), so these go in style props.
const LOCAL = "var(--git-local)";
const REMOTE = "var(--git-remote)";
const ACCENT = "var(--accent-primary)";
const LANE_COLORS = [LOCAL, REMOTE, "var(--git-modified)", "var(--lane-2)", "var(--lane-3)", "var(--accent-soft)"];
const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

type Tag = { key: string; label: string; color: string; x: number; y: number; stack: number };
type Node = { id: string; x: number; y: number; color: string; merge: boolean };
type Edge = { key: string; d: string; color: string };

function edgePath(px: number, py: number, cx: number, cy: number, dx: number) {
  const ex = cx - R - 4;
  if (py === cy) return `M ${px + R} ${py} L ${ex} ${cy}`;
  return `M ${px + R * 0.7} ${py + Math.sign(cy - py) * R * 0.7} C ${px + dx * 0.55} ${cy}, ${cx - dx * 0.6} ${cy}, ${ex} ${cy}`;
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
    const branchColor = (name: string) => (lanes.includes(name) ? laneColor(lanes.indexOf(name)) : REMOTE);

    // Pointer tags, stacked above the commit they point at.
    const localTagsAt = new Map<string, { key: string; label: string; color: string }[]>();
    const addTag = (map: typeof localTagsAt, id: string, tag: { key: string; label: string; color: string }) => {
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(tag);
    };
    if (repo.detached) addTag(localTagsAt, repo.detached, { key: "HEAD", label: "HEAD", color: ACCENT });
    for (const name of Object.keys(repo.branches).sort((a, b) => (a === "main" ? -1 : b === "main" ? 1 : a.localeCompare(b)))) {
      const current = !repo.detached && repo.head === name;
      addTag(localTagsAt, repo.branches[name], { key: `b-${name}`, label: `${name}${current ? "*" : ""}`, color: branchColor(name) });
    }
    const remoteTagsAt = new Map<string, { key: string; label: string; color: string }[]>();
    for (const name of Object.keys(shownRemote).sort()) {
      addTag(remoteTagsAt, shownRemote[name], { key: `r-${name}`, label: `origin/${name}`, color: REMOTE });
    }

    const maxStack = Math.max(1, ...[...localTagsAt.values(), ...remoteTagsAt.values()].map((t) => t.length));
    const tagSpace = maxStack * TAG_STEP + 14;
    const laneGap = Math.max(76, maxStack * TAG_STEP + 2 * R + 24);

    const localLanes = Math.max(1, ...ids.map((id) => (laneOf.get(id) ?? 0) + 1));
    const localY = (lane: number) => HEADER + tagSpace + R + lane * laneGap;
    const tunnelTop = localY(localLanes - 1) + R + 34;
    const remoteTop = tunnelTop + TUNNEL;

    const remoteShown = new Set<string>();
    for (const tip of Object.values(shownRemote)) for (const id of gitEngine.reachable(repo, tip)) remoteShown.add(id);
    const remoteAll = new Set(remoteShown);
    for (const tip of Object.values(repo.remote)) for (const id of gitEngine.reachable(repo, tip)) remoteAll.add(id);
    const remoteLanes = Math.max(1, ...Array.from(remoteAll).map((id) => (laneOf.get(id) ?? 0) + 1));
    const remoteY = (lane: number) => remoteTop + HEADER + tagSpace + R + lane * laneGap;
    const height = remoteY(remoteLanes - 1) + R + 36;

    const gaps = Math.max(1, ids.length - 1);
    const dx = Math.min(DX, Math.max(MIN_DX, (width - PAD_X * 2) / gaps));
    const xOf = (id: string) => PAD_X + (rank.get(id) ?? 0) * dx;
    const svgWidth = Math.max(width, PAD_X * 2 + Math.max(0, ids.length - 1) * dx);

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
          edges.push({ key: `${prefix}${parentId}-${child.id}`, d: edgePath(parent.x, parent.y, child.x, child.y, dx), color: child.color });
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
  const w = tag.label.length * 7.4 + 16;
  const y = -R - 10 - tag.stack * TAG_STEP - TAG_H;
  return (
    <g className="gs-move" style={{ transform: `translate(${tag.x}px, ${tag.y}px)` }}>
      {tag.stack === 0 && <line x1={0} y1={-R - 1} x2={0} y2={-R - 10} strokeWidth={1.5} style={{ stroke: tag.color }} />}
      <g className="gs-tag-in">
        <rect x={-w / 2} y={y} width={w} height={TAG_H} rx={3} strokeWidth={1} style={{ fill: tint(tag.color, 14), stroke: tag.color }} />
        <text x={0} y={y + TAG_H / 2} dy="0.35em" textAnchor="middle" fontSize={12} fontWeight={700} className="gs-svg-code" style={{ fill: tag.color }}>
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
        {head && <circle r={R + 6} fill="none" strokeWidth={1.5} strokeDasharray="3 3" className="gs-head-ring" style={{ stroke: ACCENT }} />}
        {selected && <circle r={R + 3.5} fill="none" strokeWidth={1.75} style={{ stroke: "var(--text-main)" }} />}
        <circle r={R} strokeWidth={2.5} style={{ fill: remote ? `color-mix(in srgb, ${REMOTE} 12%, var(--bg-surface))` : "var(--bg-surface)", stroke: node.color }} />
        {node.merge && <circle r={R - 5} fill="none" strokeWidth={1} opacity={0.7} style={{ stroke: node.color }} />}
        <text textAnchor="middle" dy="0.35em" fontSize={11.5} fontWeight={700} className="gs-svg-code" style={{ fill: "var(--text-main)" }}>
          {node.id}
        </text>
      </g>
    </g>
  );
}

/** One compact line: which commit, its message, its branch and how many files it holds. */
function Inspector({ repo, id }: { repo: RepoState; id: string }) {
  const commit = repo.commits[id];
  const files = Object.keys(commit.files).length;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-(--border-subtle) bg-(--bg-panel) px-5 py-3.5 text-sm">
      <span className="gs-label">Inspecting</span>
      <span className="gs-code font-bold text-(--accent-soft)">{commit.id}</span>
      <span className="min-w-0 truncate text-(--text-main)">“{commit.message.split("\n")[0]}”</span>
      <span className="text-(--text-muted)">
        branch <span className="gs-code text-(--text-main)">{commit.branch}</span>
      </span>
      <span className="text-(--text-muted)">
        {files} file{files === 1 ? "" : "s"}
      </span>
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
                <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: "var(--text-muted)" }} />
              </marker>
              <filter id="gs-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="gs-tunnel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: LOCAL, stopOpacity: 0.07 }} />
                <stop offset="0.5" style={{ stopColor: ACCENT, stopOpacity: 0.1 }} />
                <stop offset="1" style={{ stopColor: REMOTE, stopOpacity: 0.08 }} />
              </linearGradient>
            </defs>

            {/* Zones */}
            <rect x={0} y={0} width={view.svgWidth} height={view.tunnelTop} style={{ fill: tint(LOCAL, 4) }} />
            <rect x={0} y={view.tunnelTop} width={view.svgWidth} height={TUNNEL} fill="url(#gs-tunnel)" />
            <line x1={0} x2={view.svgWidth} y1={view.tunnelTop} y2={view.tunnelTop} strokeDasharray="6 5" style={{ stroke: "var(--border-subtle)" }} />
            <line x1={0} x2={view.svgWidth} y1={view.remoteTop} y2={view.remoteTop} strokeDasharray="6 5" style={{ stroke: "var(--border-subtle)" }} />
            <rect x={0} y={view.remoteTop} width={view.svgWidth} height={view.height - view.remoteTop} style={{ fill: tint(REMOTE, 5) }} />

            {/* Tunnel data lanes while pushing */}
            {capsules.map((c) => (
              <g key={`lane-${pushEvent?.id}-${c.id}`}>
                <line
                  x1={c.x}
                  x2={c.x}
                  y1={view.tunnelTop + 4}
                  y2={view.remoteTop - 4}
                  strokeWidth={2}
                  strokeDasharray="4 6"
                  className="gs-stream"
                  style={{ stroke: ACCENT, animationDuration: `${600 * slow}ms` }}
                />
                {[0, 1, 2].map((k) => (
                  <circle
                    key={k}
                    cx={c.x}
                    cy={view.tunnelTop + 6}
                    r={3}
                    filter="url(#gs-glow)"
                    className="gs-data-dot"
                    style={
                      {
                        fill: k % 2 ? LOCAL : ACCENT,
                        "--gs-dy": `${TUNNEL - 12}px`,
                        animationDuration: `${700 * slow}ms`,
                        animationDelay: `${c.delay + k * 220 * slow}ms`,
                      } as CSSProperties
                    }
                  />
                ))}
              </g>
            ))}

            {/* Local repository */}
            {view.localEdges.map((e) => (
              <path key={e.key} d={e.d} fill="none" strokeOpacity={0.6} strokeWidth={2} markerEnd="url(#gs-arrow)" className="gs-edge" style={{ stroke: e.color }} />
            ))}
            {view.localNodes.map((n) => (
              <CommitNode key={n.id} node={n} head={n.id === headId} selected={n.id === selected} onSelect={select} />
            ))}
            {view.localTags.map((t) => (
              <TagShape key={t.key} tag={t} />
            ))}

            {/* GitHub */}
            {view.remoteEdges.map((e) => (
              <path key={e.key} d={e.d} fill="none" strokeOpacity={0.55} strokeWidth={2} markerEnd="url(#gs-arrow)" className="gs-edge" style={{ stroke: REMOTE }} />
            ))}
            {view.remoteNodes.map((n) => (
              <CommitNode key={`r-${n.id}`} node={{ ...n, color: REMOTE }} head={false} selected={n.id === selected} remote onSelect={select} />
            ))}
            {view.remoteTags.map((t) => (
              <TagShape key={t.key} tag={t} />
            ))}

            {/* Payload capsules travelling Local -> GitHub */}
            {capsules.map((c) => (
              <g key={`cap-${pushEvent?.id}-${c.id}`} style={{ transform: `translate(${c.x}px, ${c.from}px)` }} aria-hidden="true">
                <g
                  className="gs-capsule"
                  style={
                    { "--gs-dy": `${c.dy}px`, "--gs-mid": `${c.mid}px`, animationDuration: `${TRAVEL * slow}ms`, animationDelay: `${c.delay}ms` } as CSSProperties
                  }
                >
                  <rect x={-34} y={-13} width={68} height={26} rx={13} strokeWidth={1.5} filter="url(#gs-glow)" style={{ fill: `color-mix(in srgb, ${ACCENT} 18%, var(--bg-surface))`, stroke: ACCENT }} />
                  <text textAnchor="middle" dy="0.35em" fontSize={12} fontWeight={700} className="gs-svg-code" style={{ fill: "var(--text-main)" }}>
                    📦 {c.id}
                  </text>
                </g>
              </g>
            ))}
          </svg>
        </div>

        {/* Zone headers sit over the graph but do not scroll with it. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 px-5 py-4">
          <p className="gs-ui flex items-center gap-2 text-[13px] font-bold tracking-wide text-(--git-local) uppercase">
            <Laptop className="size-4" aria-hidden="true" /> Local repository <span className="font-normal normal-case text-(--text-muted)">· your machine</span>
          </p>
          <p className="gs-badge bg-(--bg-surface) text-(--text-muted)">
            HEAD → <span className={repo.detached ? "text-(--git-modified)" : "text-(--git-local)"}>{repo.detached ? `detached @ ${repo.detached}` : repo.head}</span>
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center px-5" style={{ top: view.tunnelTop, height: TUNNEL }}>
          <p
            className={`gs-ui rounded border bg-(--bg-surface) px-3 py-1.5 text-[13px] ${
              pushEvent ? "gs-blink border-(--accent-primary) text-(--accent-soft)" : "border-(--border-subtle) text-(--text-muted)"
            }`}
          >
            {pushEvent
              ? `⇣ Sending ${pushEvent.commits.length} commit${pushEvent.commits.length === 1 ? "" : "s"} · git push origin ${pushBranch}`
              : `HTTPS / SSH tunnel · git push origin ${pushBranch}`}
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex items-center justify-between gap-3 px-5 py-4" style={{ top: view.remoteTop }}>
          <p className="gs-ui flex items-center gap-2 text-[13px] font-bold tracking-wide text-(--git-remote) uppercase">
            <Cloud className="size-4" aria-hidden="true" /> Remote · GitHub <span className="font-normal normal-case text-(--text-muted)">(origin)</span>
          </p>
          <p role="status" className={`gs-badge bg-(--bg-surface) font-bold ${unpushed ? "text-(--git-modified)" : "text-(--git-local)"}`}>
            {unpushed ? `⚠ ${unpushed} Commit${unpushed === 1 ? "" : "s"} Ahead (Unpushed)` : "✓ Synced with GitHub"}
          </p>
        </div>
      </div>

      {selected && repo.commits[selected] && <Inspector repo={repo} id={selected} />}
    </div>
  );
}
