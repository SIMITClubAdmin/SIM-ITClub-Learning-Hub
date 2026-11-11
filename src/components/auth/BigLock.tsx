/** The large padlock on the "members only" cards in Practice and the leaderboard. */
export function BigLock() {
  return (
    <svg viewBox="0 0 24 24" className="size-12 text-accent" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="11" rx="1.5" fill="currentColor" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="15.5" r="1.6" fill="#070b1f" />
      <rect x="11.3" y="16" width="1.4" height="3" fill="#070b1f" />
    </svg>
  );
}
