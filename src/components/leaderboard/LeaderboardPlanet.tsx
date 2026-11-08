export type LeaderboardEntry = { name: string; score: number };

// A cool teal moon: craters and soft maria, fixed so server and client match.
const CRATERS = [
  [38, 30, 5], [62, 22, 2.5], [150, 28, 4], [118, 44, 6], [24, 58, 3.5], [84, 62, 3],
  [170, 60, 5], [56, 82, 6], [138, 80, 3], [100, 18, 2], [12, 82, 4], [190, 88, 3.5],
];
const MARIA = [
  [70, 40, 22, 9], [140, 62, 26, 11], [30, 75, 18, 8], [105, 88, 30, 10],
];

/** A huge moon whose top curve fills the bottom of the page; it stays round at any width. */
function PlanetCap() {
  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="xMidYMin slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="lb-cap">
          <circle cx="100" cy="190" r="180" />
        </clipPath>
        <radialGradient id="lb-shade" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#070b1f" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id="lb-glow" cx="50%" cy="100%" r="60%">
          <stop offset="85%" stopColor="#4fd8eb" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4fd8eb" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="190" r="186" fill="url(#lb-glow)" />
      <circle cx="100" cy="190" r="180.6" fill="none" stroke="#7fe6d4" strokeOpacity="0.8" strokeWidth="0.4" />
      <g clipPath="url(#lb-cap)">
        <rect width="200" height="100" fill="#1d5f63" />
        {MARIA.map(([x, y, rx, ry]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={rx} ry={ry} fill="#154a50" opacity="0.7" />
        ))}
        {CRATERS.map(([x, y, r]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={r} fill="#0f3b40" opacity="0.6" />
            <circle cx={x - r * 0.18} cy={y - r * 0.22} r={r * 0.78} fill="#2a7a7c" opacity="0.6" />
          </g>
        ))}
        <rect width="200" height="100" fill="url(#lb-shade)" />
      </g>
    </svg>
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

/** Top three astronauts stand on the planet's curve; everyone else is listed on its surface. */
export function LeaderboardPlanet({ entries }: { entries: LeaderboardEntry[] }) {
  const ranked = [...entries].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 3);
  const best = ranked[0]?.score || 1;
  // Second on the left, first in the middle and highest, third on the right.
  const podium = [
    { entry: top[1], rank: 2, lift: "sm:translate-y-6" },
    { entry: top[0], rank: 1, lift: "sm:-translate-y-4" },
    { entry: top[2], rank: 3, lift: "sm:translate-y-10" },
  ];

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="relative z-10 px-4 pt-6 text-center sm:px-8">
        {ranked.length === 0 ? (
          <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">Who will set foot first?</h1>
        ) : (
          <>
            <h1 className="sr-only">Leaderboard</h1>
            <p className="text-right font-display text-2xl font-semibold sm:absolute sm:top-4 sm:right-8">Top 3</p>
            <ol className="mx-auto mt-4 flex max-w-3xl items-end justify-center gap-4 sm:gap-12">
              {podium.map(({ entry, rank, lift }) =>
                entry ? (
                  <li key={rank} className={`${lift} ${rank === 1 ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}>
                    <span className="sr-only">Rank {rank}: </span>
                    <Astronaut entry={entry} rank={rank} />
                  </li>
                ) : null,
              )}
            </ol>
          </>
        )}
      </div>

      {/* The planet: the astronauts' feet rest on its top edge. */}
      <div
        className="relative min-h-[60svh] flex-1"
        // The moon's top sits 5% of the width down its box; pull it up so feet touch the surface.
        style={{ marginTop: ranked.length > 0 ? "calc(-5vw + 6px)" : "1rem" }}
      >
        <PlanetCap />
        {ranked.length > 0 && (
          <ol className="relative mx-auto flex max-w-2xl flex-col gap-3 px-6 pt-[14vw] pb-16 sm:pt-[10vw]">
            {ranked.map((entry, i) => (
              <li key={`${entry.name}-${i}`} className="grid grid-cols-[2rem_8rem_1fr] items-center gap-3 sm:grid-cols-[2rem_10rem_1fr]">
                <span className="font-mono text-sm text-dim">{i + 1}.</span>
                <span className="truncate font-medium">{entry.name}</span>
                <span className="relative h-7 bg-bg/70">
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
        )}
        {ranked.length === 0 && (
          <p className="relative mx-auto max-w-md px-6 pt-[16vw] text-center text-ink drop-shadow-[0_1px_2px_rgb(7_11_31)]">
            No one has landed yet. Finish a practice mission to plant the first flag.
          </p>
        )}
      </div>
    </div>
  );
}
