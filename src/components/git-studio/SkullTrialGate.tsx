"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useLocalTitles } from "@/lib/skull-titles-store";
import { cleanTitleIds, findTrial, lockedReason, trialHref, trialPrerequisite, type SkullTrial, type TitleId } from "@/lib/skull-trials";

/**
 * Keeps Skull Trials 4 and 5 shut for members until the tier before them is unlocked, on the
 * profile or in this browser. While locked, the studio never starts, so the trial can't be
 * solved early. Guests can enter every trial.
 */
export function SkullTrialGate({
  trialId,
  owner,
  serverTitles,
  guest = false,
  children,
}: {
  trialId: SkullTrial["id"];
  owner: string | null;
  serverTitles: TitleId[];
  /** Guest mode, or a registered guest account. */
  guest?: boolean;
  children: ReactNode;
}) {
  const trial = findTrial(trialId)!;
  const local = useLocalTitles(owner);
  const reason = guest ? null : lockedReason(trial, cleanTitleIds([...serverTitles, ...local]));
  if (!reason) return <>{children}</>;
  const needs = trialPrerequisite(trial)!;
  return (
    <section aria-label="Locked trial" className="gs-card flex flex-col items-start gap-3 p-8">
      <p className="gs-ui flex items-center gap-2 text-sm font-bold tracking-widest text-(--text-muted) uppercase">
        <Lock className="size-4" aria-hidden="true" /> Locked
      </p>
      <p className="gs-heading text-2xl font-semibold">{reason}.</p>
      <p className="text-(--text-muted)">The ranks open one at a time: solve the trial before this one to unlock it.</p>
      {/* A plain link with a computed href: the trial pages need a full page load for their isolation headers. */}
      <a href={trialHref(needs.trial)} className="cta">
        Go to Skull Trial {needs.trial}
      </a>
    </section>
  );
}
