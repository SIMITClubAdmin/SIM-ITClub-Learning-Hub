"use client";

import { useEffect, useRef, useState } from "react";
import { unlockSkullTitle } from "@/app/practice/skull/actions";
import { InlineCode } from "@/components/practice/InlineCode";
import { addLocalTitle } from "@/lib/skull-titles-store";
import { findTrial, optimalCount, titleText, trialPrerequisite, type SkullTrial, type TitleId } from "@/lib/skull-trials";
import { trialSolved } from "./engine/skull-checks";
import { JEFF_FOLDER } from "./engine/workspaces";
import { useStudio } from "./WebContainerProvider";

/* ---------- The trial panels ---------- */

const PILL = "gs-pill";

function Rich({ text }: { text: string }) {
  return <InlineCode text={text} codeClassName={PILL} />;
}

type Solved = { session: number; used: number };

/**
 * A Skull Trial above the studio: the problem, the expected output and, once the sandbox
 * reaches that state, SOLVED with a comparison against the shortest solution. No hints, no
 * command shortcuts (the studio runs with hints off) and no cheatsheet.
 */
export function SkullTrialGuide({
  trialId,
  owner,
  signedIn,
  knownTitles = [],
}: {
  trialId: SkullTrial["id"];
  owner: string | null;
  signedIn: boolean;
  /** Titles already on the profile (a prerequisite earned on another device counts). */
  knownTitles?: TitleId[];
}) {
  const trial = findTrial(trialId)!;
  const { repo, repoRoot, files, status, commands, session } = useStudio();
  const [solved, setSolved] = useState<Solved | null>(null);
  const [saved, setSaved] = useState<"idle" | "saved" | "local" | "locked">("idle");
  const unlocked = useRef(false);

  // Every Git command counts, typed or mistyped; editor saves don't.
  const used = commands.length;
  const met = !!repo && !!status && repoRoot === JEFF_FOLDER && trialSolved(trial.id, { repo, files, status });

  // Latch the first time the goal is met (and start over after Reset), during render.
  if (solved && solved.session !== session) setSolved(null);
  else if (!solved && met) setSolved({ session, used });

  // Unlock the title once: in this browser, and on the profile when logged in.
  useEffect(() => {
    if (!solved || unlocked.current) return;
    unlocked.current = true;
    addLocalTitle(owner, trial.reward, knownTitles);
    if (!signedIn) return;
    void unlockSkullTitle(trial.reward).then((r) => setSaved(r.ok ? "saved" : r.reason === "locked" ? "locked" : "local"));
  }, [solved, owner, signedIn, trial.reward, knownTitles]);

  const prerequisite = trialPrerequisite(trial);

  const best = optimalCount(trial);

  return (
    <div className="mb-5 flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="problem-heading" className="gs-card p-6">
          <h2 id="problem-heading" className="gs-ui text-sm font-bold tracking-widest text-(--git-danger) uppercase">
            The problem
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed">
            <Rich text={trial.problem} />
          </p>
        </section>
        <section aria-labelledby="expected-heading" className="gs-card p-6">
          <h2 id="expected-heading" className="gs-ui text-sm font-bold tracking-widest text-(--git-local) uppercase">
            Expected output
          </h2>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-relaxed">
            {trial.expected.map((line) => (
              <li key={line}>
                <Rich text={line} />
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div
        role="status"
        className={`gs-card flex flex-wrap items-center justify-between gap-3 px-6 py-4 ${solved ? "border-(--git-local)" : ""}`}
      >
        <p className="gs-ui text-sm font-bold tracking-wider uppercase">
          {solved ? <span className="text-(--git-local)">💀 Solved</span> : <span className="text-(--text-muted)">Not solved yet</span>}
        </p>
        <p className="gs-ui text-sm text-(--text-muted)">
          Git commands used: <span className="text-(--text-main)">{solved ? solved.used : used}</span>
        </p>
      </div>

      {solved && (
        <section aria-label="Trial result" className="gs-card flex flex-col gap-4 border-(--git-local) p-6">
          <p className="gs-heading text-xl font-semibold">
            Title unlocked: <span className="text-(--accent-text)">[{titleText(trial.reward)}]</span>
          </p>
          <p className="text-sm text-(--text-muted)">
            {signedIn
              ? saved === "locked"
                ? `Saved in this browser only: your account doesn't have ${prerequisite ? `Skull Trial ${prerequisite.trial}'s title` : "the tier before"} yet, so this tier can't be added to it.`
                : saved === "local"
                ? "Saved in this browser. We couldn't save it to your account just now: it is added when you save your account settings."
                : "Equip it on your account page. It shows beside your name on the leaderboard while you are in the top 3."
              : "Saved in this browser. Log in with an account to equip titles on the leaderboard."}
          </p>
          {solved.used <= best ? (
            <p className="rounded border border-(--git-local) bg-[color-mix(in_srgb,var(--git-local)_12%,var(--bg-surface))] px-4 py-3">
              ⚡ Flawless Execution! You solved this using the most optimal workflow possible.
            </p>
          ) : (
            <details className="gs-details rounded border border-(--border-subtle) bg-(--bg-panel)">
              <summary className="gs-ui cursor-pointer px-4 py-3 text-sm font-bold">💡 Optimal Way to Do It</summary>
              <div className="border-t border-(--border-subtle) px-4 py-3">
                <p className="text-sm">
                  You solved it in {solved.used} Git commands! Here is how you can do it in {best} next time:
                </p>
                <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm">
                  {trial.optimal.map((step) => (
                    <li key={step}>{step.startsWith("✎") ? <span className="text-(--text-muted)">{step.slice(1).trim()}</span> : <code className={PILL}>{step}</code>}</li>
                  ))}
                </ol>
              </div>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
