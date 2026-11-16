import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SkullTrialShell } from "@/components/git-studio/SkullTrialShell";
import { StudioLoader } from "@/components/git-studio/StudioLoader";
import { findTrial, titleText } from "@/lib/skull-trials";
import { createClient } from "@/lib/supabase/server";

// Knows who is solving it (for saving the title), so this page renders per request.
export const instant = false;

type Props = { params: Promise<{ trial: string }> };

function trialFrom(raw: string) {
  const trial = findTrial(Number(raw));
  return trial && String(trial.id) === raw ? trial : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trial = trialFrom((await params).trial);
  return { title: trial ? `Skull Trial ${trial.id}: ${trial.name} · ITCamp Learning Hub` : "Skull Trial · ITCamp Learning Hub" };
}

/**
 * An optional Skull Trial: a hands-on Git boss challenge in the studio, with no hints, no
 * command shortcuts and no cheatsheet. src/proxy.ts already requires a login or guest mode.
 */
export default async function SkullTrialPage({ params }: Props) {
  await connection();
  const trial = trialFrom((await params).trial);
  if (!trial) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SkullTrialShell>
      <header className="flex flex-col gap-2">
        {/* useIsolationGuard turns links out of this isolated page into full page loads. */}
        <Link href="/practice" className="gs-ui text-sm tracking-wider text-(--text-muted) uppercase hover:text-(--accent-text)">
          ← All challenges
        </Link>
        <p className="gs-ui mt-2 text-sm font-bold tracking-widest text-(--git-danger) uppercase">
          Optional boss challenge · Skull Trial {trial.id}
        </p>
        <h1 className="gs-heading text-4xl font-semibold sm:text-5xl">
          <span aria-hidden="true">{"💀".repeat(trial.id)} </span>
          {trial.name}
        </h1>
        <p className="gs-ui text-sm text-(--text-muted)">
          Difficulty: <span className="text-(--text-main)">{trial.difficulty}</span> · Reward title:{" "}
          <span className="text-(--accent-text)">[{titleText(trial.reward)}]</span> · No hints, no cheatsheet: any valid Git commands work.
        </p>
      </header>
      <StudioLoader kind={`skull${trial.id}`} owner={user?.id ?? null} signedIn={!!user} />
    </SkullTrialShell>
  );
}
