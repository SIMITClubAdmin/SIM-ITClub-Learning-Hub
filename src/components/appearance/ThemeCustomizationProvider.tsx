"use client";

import { useEffect } from "react";
import { hasSavedAppearance, saveAppearance, useAppearance } from "@/lib/appearance";
import { applyToDocument, FONTS, PALETTES, WORLDS, type Appearance } from "@/lib/appearance-config";
import { createClient } from "@/lib/supabase/client";

/** Reads a saved profile value back into a valid Appearance, ignoring anything unknown. */
export function fromProfile(raw: unknown): Partial<Appearance> {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<Appearance> = {};
  if (FONTS.some((f) => f.id === r.font)) out.font = r.font as Appearance["font"];
  if (PALETTES.some((p) => p.id === r.palette)) out.palette = r.palette as Appearance["palette"];
  if (WORLDS.some((w) => w.id === r.world)) out.world = r.world as Appearance["world"];
  return out;
}

/**
 * Mounted once in the root layout. Keeps <html>'s appearance attributes in step with the
 * saved choice, and on a device that has never chosen, adopts the one in the member's profile.
 */
export function ThemeCustomizationProvider() {
  const { font, palette, world } = useAppearance();

  useEffect(() => {
    applyToDocument({ font, palette, world });
  }, [font, palette, world]);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const { data } = createClient().auth.onAuthStateChange((event, session) => {
        if (!session || (event !== "INITIAL_SESSION" && event !== "SIGNED_IN")) return;
        const saved = fromProfile(session.user.user_metadata?.hub_appearance);
        if (Object.keys(saved).length && !hasSavedAppearance()) saveAppearance(saved);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      // No Supabase settings (local dev without .env.local): the browser copy still works.
    }
    return () => unsubscribe();
  }, []);

  return null;
}
