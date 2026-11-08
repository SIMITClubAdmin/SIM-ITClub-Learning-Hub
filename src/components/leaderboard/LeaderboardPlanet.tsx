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

/** Height of the moon's surface below its top edge, in cqw, at d cqw from its centre. */
const surface = (d: number) => R - Math.sqrt(R * R - d * d);

function Moon() {
  return (
    <div
      className="absolute left-1/2 aspect-square -translate-x-1/2 overflow-hidden rounded-full"
      style={{
        width: `${R * 2}cqw`,
        top: "var(--moon-top)",
        background: "radial-gradient(circle at 50% 0%, #2a7a7c, #1d5f63 25%, #123f45 55%)",
        boxShadow: "0 0 0 2px rgb(127 230 212 / 0.8), 0 0 60px 10px rgb(79 216 235 / 0.25)",
      }}
      aria-hidden="true"
    >
      {/* Only the top half shows on screen, so the detail lives there. */}
      <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full">
        {MARIA.map(([x, y, rx, ry]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill="#0f3b40" opacity="0.45" />
        ))}
        {CRATERS.map(([x, y, r]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={r * 0.55} fill="#0b2f34" opacity="0.6" />
            <circle cx={x - r * 0.1} cy={y - r * 0.12} r={r * 0.43} fill="#2a7a7c" opacity="0.55" />
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
      <p className="border border-violet bg-bg/90 px-3 py-1 font-mono text-sm text-accent">
        {entry.score.toLocaleString()} pts
      </p>
      <p className="mt-2 max-w-36 truncate font-display text-lg font-semibold">{entry.name}</p>
      <svg viewBox="0 0 90 100" className="mt-1 w-24 sm:w-28" aria-hidden="true">
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
    { entry: ranked[1], rank: 2, d: -16 },
    { entry: ranked[0], rank: 1, d: 0 },
    { entry: ranked[2], rank: 3, d: 16 },
  ];
  const moonTop = ranked.length > 0 ? "max(17rem, 40svh)" : "max(13rem, 34svh)";

  return (
    <div
      className="relative flex-1 overflow-clip"
      style={{ containerType: "inline-size", "--moon-top": moonTop } as React.CSSProperties}
    >
      <Moon />

      {ranked.length === 0 ? (
        <>
          <h1 className="relative px-4 pt-14 text-center text-4xl font-semibold sm:text-5xl">Who will set foot first?</h1>
          <p
            className="relative mx-auto max-w-md px-6 text-center text-ink drop-shadow-[0_1px_2px_rgb(7_11_31)]"
            style={{ marginTop: "calc(var(--moon-top) - 8.5rem + 10cqw)", paddingBottom: "30svh" }}
          >
            No one has landed yet. Finish a practice mission to plant the first flag.
          </p>
        </>
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
              <li className="text-center text-ink">Only the top 3 have landed so far.</li>
            )}
            {rest.map((entry, i) => (
              <li
                key={`${entry.name}-${i}`}
                className="lb-row grid grid-cols-[2rem_8rem_1fr] items-center gap-3 sm:grid-cols-[2.5rem_10rem_1fr]"
              >
                <span className="font-mono text-sm text-dim">{i + 4}.</span>
                <span className="truncate font-medium">{entry.name}</span>
                <span className="relative h-8 bg-bg/70">
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
