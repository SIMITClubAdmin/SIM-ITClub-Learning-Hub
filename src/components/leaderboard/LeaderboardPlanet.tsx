"use client";

import { useEffect, useRef } from "react";

export type LeaderboardEntry = { name: string; score: number };

// The moon is a circle R wide-units across, in cqw (1% of the page width), so it keeps
// its shape at any width and the astronauts can be placed exactly on its curve.
const R = 90;
// Craters and maria in a 0-100 box over the moon's top part; fixed so server and client match.
const CRATERS = [
  [20, 6, 2.2], [31, 4, 1.1], [75, 5, 1.8], [59, 9, 2.6], [12, 14, 1.6], [42, 13, 1.3],
  [85, 13, 2.2], [28, 20, 2.6], [69, 18, 1.4], [50, 3, 0.9], [8, 22, 1.8], [94, 21, 1.6],
  [38, 28, 2], [62, 30, 2.8], [18, 34, 1.4], [82, 33, 2.4], [48, 40, 1.6], [26, 46, 2.2],
];
const MARIA = [
  [35, 10, 10, 4], [70, 13, 12, 5], [15, 18, 8, 3.5], [52, 22, 14, 5], [80, 30, 10, 5], [30, 38, 12, 5],
];

type MoonColors = { light: string; mid: string; dark: string; rim: string; glow: string; maria: string; pit: string; lip: string };

// A sandy gold "winner's planet", so the white astronauts and flags stand out.
const GOLD: MoonColors = {
  light: "#ffe3a3", mid: "#e0a948", dark: "#7a5418", rim: "rgb(255 225 160 / 0.8)",
  glow: "rgb(255 190 80 / 0.3)", maria: "#b07f2c", pit: "#6a4512", lip: "#f5cd7c",
};

/** Height of the moon's surface below its top edge, in cqw, at d cqw from its centre. */
const surface = (d: number) => R - Math.sqrt(R * R - d * d);

function Moon({ c }: { c: MoonColors }) {
  return (
    <div
      className="absolute left-1/2 aspect-square -translate-x-1/2 overflow-hidden rounded-full"
      style={{
        width: `${R * 2}cqw`,
        top: "var(--moon-top)",
        background: `radial-gradient(circle at 50% 0%, ${c.light}, ${c.mid} 25%, ${c.dark} 60%)`,
        boxShadow: `0 0 0 2px ${c.rim}, 0 0 60px 10px ${c.glow}`,
      }}
      aria-hidden="true"
    >
      {/* Only the top half shows on screen, so the detail lives there. */}
      <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full">
        {MARIA.map(([x, y, rx, ry]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill={c.maria} opacity="0.5" />
        ))}
        {CRATERS.map(([x, y, r]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={r * 0.55} fill={c.pit} opacity="0.6" />
            <circle cx={x - r * 0.1} cy={y - r * 0.12} r={r * 0.43} fill={c.lip} opacity="0.6" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** An astronaut planting a flag, with the score tag and name floating above. */
function Astronaut({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const flag = rank === 1 ? "#4fd8eb" : rank === 2 ? "#d4caff" : "#ffb38a";
  return (
    <div className="flex flex-col items-center">
      <p className="border border-violet bg-bg/90 px-3 py-1 font-mono text-base text-accent">
        {entry.score.toLocaleString()} pts
      </p>
      <p className="mt-2 max-w-48 truncate font-display text-xl font-semibold sm:text-2xl">{entry.name}</p>
      <svg viewBox="0 0 90 100" className="mt-1 w-32 sm:w-44" aria-hidden="true">
        {/* Flag */}
        <line x1="14" y1="8" x2="14" y2="100" stroke="#e6f1ff" strokeWidth="2.5" />
        <path d="M15 9 L42 19 L15 29 Z" fill={flag} />
        <text x="22" y="22" fontSize="9" fontFamily="var(--font-jetbrains)" fill="#070b1f" fontWeight="700">
          {rank}
        </text>
        {/* Backpack, suit, helmet */}
        <rect x="46" y="44" width="12" height="24" rx="3" fill="#94a3c8" />
        <rect x="50" y="42" width="24" height="32" rx="8" fill="#e6f1ff" />
        <circle cx="62" cy="32" r="14" fill="#e6f1ff" />
        <rect x="54" y="26" width="18" height="11" rx="5" fill="#070b1f" />
        <rect x="57" y="28" width="6" height="3" rx="1.5" fill="#4fd8eb" opacity="0.8" />
        {/* Arm reaching to the flag */}
        <path d="M54 50 L20 46" stroke="#e6f1ff" strokeWidth="7" strokeLinecap="round" />
        {/* Legs */}
        <rect x="52" y="70" width="8" height="22" rx="3" fill="#e6f1ff" />
        <rect x="64" y="70" width="8" height="22" rx="3" fill="#e6f1ff" />
        <rect x="50" y="90" width="11" height="6" rx="2" fill="#94a3c8" />
        <rect x="63" y="90" width="11" height="6" rx="2" fill="#94a3c8" />
      </svg>
    </div>
  );
}

/** A small rocket drifting through the sky behind everything, heading for the moon. */
function Rocket() {
  return (
    <div className="lb-rocket pointer-events-none absolute top-[12%] left-[8%] w-20 sm:w-28" aria-hidden="true">
      <svg viewBox="0 0 120 60" className="w-full rotate-[18deg]">
        <g className="lb-flame">
          <path d="M22 30 L2 22 L8 30 L2 38 Z" fill="#ffb347" />
          <path d="M22 30 L10 26 L13 30 L10 34 Z" fill="#fff6d8" />
        </g>
        <path d="M30 18 L18 8 L22 22 Z M30 42 L18 52 L22 38 Z" fill="#6d4aff" />
        <path d="M20 22 H80 Q108 22 116 30 Q108 38 80 38 H20 Z" fill="#e6f1ff" />
        <path d="M100 24 Q112 27 116 30 Q112 33 100 36 Z" fill="#be3caa" />
        <circle cx="72" cy="30" r="5.5" fill="#070b1f" />
        <circle cx="72" cy="30" r="3.5" fill="#4fd8eb" />
        <rect x="36" y="27" width="20" height="6" rx="1" fill="#94a3c8" />
      </svg>
    </div>
  );
}

/** Fades each row in as it scrolls into view. */
function useReveal() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const rows = ref.current?.querySelectorAll(".lb-row");
    if (!rows) return;
    const observer = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (item.isIntersecting) {
            item.target.classList.add("is-in");
            observer.unobserve(item.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  });
  return ref;
}

/** The top three astronauts land on the moon; scrolling down reveals 4th place onwards. */
export function LeaderboardPlanet({ entries }: { entries: LeaderboardEntry[] }) {
  const ranked = [...entries].sort((a, b) => b.score - a.score);
  const rest = ranked.slice(3);
  const best = ranked[0]?.score || 1;
  const listRef = useReveal();
  // Second on the left, first in the middle, third on the right; d is cqw from the centre.
  const podium = [
    { entry: ranked[1], rank: 2, d: -20 },
    { entry: ranked[0], rank: 1, d: 0 },
    { entry: ranked[2], rank: 3, d: 20 },
  ];
  // Near the bottom of the first screen, leaving a strip of moon in view.
  const moonTop = ranked.length > 0 ? "max(22rem, calc(100svh - 15rem))" : "max(16rem, calc(100svh - 17rem))";

  return (
    <div
      className="relative flex-1 overflow-clip"
      style={{ containerType: "inline-size", "--moon-top": moonTop } as React.CSSProperties}
    >
      <Rocket />
      <Moon c={GOLD} />

      {ranked.length === 0 ? (
        // The sky between the header and the moon, with the message centred in it.
        <div
          className="relative flex flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ height: "var(--moon-top)" }}
        >
          <h1 className="text-4xl font-semibold sm:text-6xl">Who will set foot first?</h1>
          <p className="max-w-md text-lg text-dim">
            No one has landed yet. Finish a practice mission to plant the first flag.
          </p>
        </div>
      ) : (
        <>
          <h1 className="sr-only">Leaderboard</h1>
          <p className="absolute top-4 right-4 font-display text-2xl font-semibold sm:right-8">Top 3</p>
          <ol>
            {podium.map(({ entry, rank, d }) =>
              entry ? (
                <li
                  key={rank}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${d}cqw)`,
                    // Feet on the surface, leaning with the curve.
                    top: `calc(var(--moon-top) + ${surface(d) + 0.3}cqw)`,
                    transform: `translate(-50%, -100%) rotate(${(Math.asin(d / R) * 180) / Math.PI}deg)`,
                    transformOrigin: "50% 100%",
                  }}
                >
                  <span className="sr-only">Rank {rank}: </span>
                  <Astronaut entry={entry} rank={rank} />
                </li>
              ) : null,
            )}
          </ol>

          <ol
            ref={listRef}
            start={4}
            className="relative mx-auto flex max-w-2xl flex-col gap-3 px-6"
            style={{ paddingTop: "calc(var(--moon-top) + 8cqw)", paddingBottom: "20svh" }}
          >
            {rest.length === 0 && (
              <li className="bg-bg/85 px-4 py-2.5 text-center text-ink">Only the top 3 have landed so far.</li>
            )}
            {rest.map((entry, i) => (
              <li
                key={`${entry.name}-${i}`}
                className="lb-row grid grid-cols-[2rem_8rem_1fr] items-center gap-3 border border-violet/50 bg-bg/85 px-4 py-2.5 sm:grid-cols-[2.5rem_10rem_1fr]"
              >
                <span className="font-mono text-sm text-dim">{i + 4}.</span>
                <span className="truncate font-medium">{entry.name}</span>
                <span className="relative h-7 bg-grid">
                  <span
                    className="absolute inset-y-0 left-0 bg-accent/80"
                    style={{ width: `${Math.max(8, (entry.score / best) * 100)}%` }}
                  />
                  <span className="relative flex h-full items-center px-3 font-mono text-xs text-ink">
                    {entry.score.toLocaleString()} pts
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
