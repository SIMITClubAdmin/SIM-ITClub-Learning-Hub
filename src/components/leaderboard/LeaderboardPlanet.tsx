export type LeaderboardEntry = { name: string; score: number };

// Soft bands across the planet's visible cap; fixed so server and client match.
const BANDS = [
  { y: 8, h: 5, color: "#a493f5" },
  { y: 18, h: 8, color: "#5646c2" },
  { y: 31, h: 4, color: "#b8a9ff" },
  { y: 40, h: 10, color: "#6150cc" },
  { y: 56, h: 6, color: "#9584ec" },
  { y: 68, h: 12, color: "#5646c2" },
];

/** A huge planet whose top curve fills the bottom of the page. */
function PlanetCap() {
  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="lb-cap">
          <ellipse cx="100" cy="110" rx="130" ry="110" />
        </clipPath>
        <linearGradient id="lb-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#070b1f" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="110" rx="131" ry="111" fill="none" stroke="#4fd8eb" strokeOpacity="0.7" strokeWidth="0.6" />
      <g clipPath="url(#lb-cap)">
        <rect width="200" height="100" fill="#4a3db0" />
        <g className="surface-drift-wide">
          {BANDS.map((b) => (
            <g key={b.y} fill={b.color} opacity="0.35">
              {[0, 200].map((dx) => (
                <path
                  key={dx}
                  d={`M${dx} ${b.y} q25 -2 50 0 t50 0 t50 0 t50 0 v${b.h} q-25 2 -50 0 t-50 0 t-50 0 t-50 0 z`}
                />
              ))}
            </g>
          ))}
        </g>
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
          <h1 className="mt-10 text-4xl font-semibold sm:text-5xl">Who will set foot first?</h1>
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
      <div className="relative -mt-6 min-h-[60svh] flex-1">
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
