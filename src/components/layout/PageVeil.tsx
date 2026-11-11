/**
 * A dark layer over the animated background, so it stays faint and never pulls attention
 * from the text. Put it inside <main> on reading and form pages. Leave it off the pages
 * that are a scene (home, Learn and Challenge planets, leaderboard).
 */
export function PageVeil() {
  return <div className="quiz-backdrop pointer-events-none fixed inset-0" style={{ zIndex: -1 }} aria-hidden="true" />;
}
