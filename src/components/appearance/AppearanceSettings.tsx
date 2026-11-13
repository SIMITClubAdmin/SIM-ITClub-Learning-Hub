"use client";

import { useRef, useState } from "react";
import { currentAppearance, useAppearance, useAppearanceOwner } from "@/lib/appearance";
import { DEFAULT_APPEARANCE, FONTS, GUEST, PALETTES, WORLD_PALETTE, WORLDS, type Appearance } from "@/lib/appearance-config";
import { saveAppearanceToProfile } from "./ThemeCustomizationProvider";

const FONT_PREVIEW: Record<Appearance["font"], string> = {
  site: "var(--font-chakra), system-ui, sans-serif",
  jetbrains: "var(--font-jetbrains), ui-monospace, monospace",
  jakarta: "var(--font-jakarta), Inter, system-ui, sans-serif",
  comic: '"Comic Sans MS", "Comic Sans", var(--font-comic-neue), cursive',
  times: '"Times New Roman", Times, serif',
};

const OPTION =
  "flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-left transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent";

/**
 * Font, colour palette and theme world for the whole site. Saved per account in this browser
 * (itcamp_theme_<user id>, or the guest copy) and, for members, in their profile too.
 */
export function AppearanceSettings({ signedIn: signedInHint }: { signedIn: boolean }) {
  const appearance = useAppearance();
  const owner = useAppearanceOwner();
  const signedIn = signedInHint || owner !== GUEST;
  const [status, setStatus] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function choose(next: Partial<Appearance>) {
    appearance.set(next);
    setStatus(signedIn ? "Saving to your profile…" : "Saved in this browser.");
    if (!signedIn) return;
    // Members get the same look on every device: keep a copy in their profile.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const ok = await saveAppearanceToProfile(currentAppearance());
        setStatus(ok ? "Saved to this browser and your profile." : "Saved in this browser (your profile could not be updated).");
      } catch {
        setStatus("Saved in this browser.");
      }
    }, 600);
  }

  // The Code, Sakura and Winter themes bring their own palette. Going back to the pixel grid
  // undoes that, but keeps any other palette the member picked by hand.
  function chooseWorld(world: Appearance["world"]) {
    const next: Partial<Appearance> = { world };
    const own = WORLD_PALETTE[world];
    if (own) next.palette = own;
    else if (Object.values(WORLD_PALETTE).includes(appearance.palette)) next.palette = DEFAULT_APPEARANCE.palette;
    choose(next);
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
        <legend className="mb-2 font-mono text-xs tracking-wider text-accent uppercase">Theme · background and cursor</legend>
        <p className="-mt-1 mb-1 text-sm text-dim">Each theme brings its own colours (Code: Matrix Green, Sakura: Sakura Pink, Winter: Winter Frost); you can pick another palette after.</p>
        <div className="grid grid-cols-2 gap-2">
          {WORLDS.map((w) => {
            const on = appearance.world === w.id;
            return (
              <label key={w.id} className={`${OPTION} flex-col items-start ${on ? "border-accent bg-accent/10" : "border-violet/60 hover:border-accent"}`}>
                <input type="radio" name="world" className="sr-only" checked={on} onChange={() => chooseWorld(w.id)} />
                <span className="h-7 font-mono text-2xl leading-none text-accent" aria-hidden="true">
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
