"use client";

import { useRef, useState } from "react";
import { useAppearance } from "@/lib/appearance";
import { DEFAULT_APPEARANCE, FONTS, PALETTES, WORLDS, type Appearance } from "@/lib/appearance-config";
import { createClient } from "@/lib/supabase/client";

const FONT_PREVIEW: Record<Appearance["font"], string> = {
  site: "var(--font-chakra), system-ui, sans-serif",
  jetbrains: "var(--font-jetbrains), ui-monospace, monospace",
  jakarta: "var(--font-jakarta), Inter, system-ui, sans-serif",
  comic: '"Comic Sans MS", "Comic Sans", var(--font-comic-neue), cursive',
  times: '"Times New Roman", Times, serif',
};

const OPTION =
  "flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-left transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent";

/** Font, colour palette and theme world for the whole site, saved per browser and (for members) to the profile. */
export function AppearanceSettings({ signedIn }: { signedIn: boolean }) {
  const appearance = useAppearance();
  const [status, setStatus] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function choose(next: Partial<Appearance>) {
    appearance.set(next);
    setStatus(signedIn ? "Saving to your profile…" : "Saved in this browser.");
    if (!signedIn) return;
    // Members get the same look on every device: keep a copy in their profile.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const merged = { font: appearance.font, palette: appearance.palette, world: appearance.world, ...next };
    saveTimer.current = setTimeout(async () => {
      try {
        const { error } = await createClient().auth.updateUser({ data: { hub_appearance: merged } });
        setStatus(error ? "Saved in this browser (your profile could not be updated)." : "Saved to this browser and your profile.");
      } catch {
        setStatus("Saved in this browser.");
      }
    }, 600);
  }

  const reset = () => choose(DEFAULT_APPEARANCE);

  return (
    <section id="appearance" aria-labelledby="appearance-heading" className="flex scroll-mt-24 flex-col gap-5 border border-violet bg-bg/85 p-5">
      <div className="flex flex-col gap-1">
        <h2 id="appearance-heading" className="text-xl font-semibold">
          Appearance &amp; Theme Personalization
        </h2>
        <p className="text-sm text-dim">Changes apply to every page straight away: lessons, challenges, the leaderboard and the Git studio.</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-mono text-xs tracking-wider text-accent uppercase">Font</legend>
        {FONTS.map((f) => {
          const on = appearance.font === f.id;
          return (
            <label key={f.id} className={`${OPTION} ${on ? "border-accent bg-accent/10" : "border-violet/60 hover:border-accent"}`}>
              <input type="radio" name="font" className="sr-only" checked={on} onChange={() => choose({ font: f.id })} />
              <span className="w-10 shrink-0 text-center text-2xl leading-none" style={{ fontFamily: FONT_PREVIEW[f.id] }} aria-hidden="true">
                Aa
              </span>
              <span className="flex flex-col">
                <span className="font-semibold">{f.label}</span>
                <span className="text-sm text-dim">{f.hint}</span>
              </span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-mono text-xs tracking-wider text-accent uppercase">Colour palette</legend>
        <div className="grid grid-cols-2 gap-2">
          {PALETTES.map((p) => {
            const on = appearance.palette === p.id;
            return (
              <label key={p.id} className={`${OPTION} ${on ? "border-accent bg-accent/10" : "border-violet/60 hover:border-accent"}`}>
                <input type="radio" name="palette" className="sr-only" checked={on} onChange={() => choose({ palette: p.id })} />
                <span
                  className="size-8 shrink-0 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${p.base} 0 50%, ${p.accent} 50% 100%)`, boxShadow: "inset 0 0 0 1px rgb(127 127 127 / 0.45)" }}
                  aria-hidden="true"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span className="text-xs text-dim">{p.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-mono text-xs tracking-wider text-accent uppercase">Theme world · background and cursor</legend>
        <div className="grid grid-cols-2 gap-2">
          {WORLDS.map((w) => {
            const on = appearance.world === w.id;
            return (
              <label key={w.id} className={`${OPTION} flex-col items-start ${on ? "border-accent bg-accent/10" : "border-violet/60 hover:border-accent"}`}>
                <input type="radio" name="world" className="sr-only" checked={on} onChange={() => choose({ world: w.id })} />
                <span className="text-2xl leading-none" aria-hidden="true">
                  {w.emoji}
                </span>
                <span className="text-sm font-semibold">{w.label}</span>
                <span className="text-xs text-dim">{w.hint}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-dim">
          {status || (signedIn ? "Saved to this browser and your profile." : "Saved in this browser.")}
        </p>
        <button type="button" onClick={reset} className="border border-violet px-3 py-1.5 font-mono text-xs tracking-wider text-dim uppercase hover:border-accent hover:text-accent">
          Reset to default
        </button>
      </div>
    </section>
  );
}
