"use client";

import { useAppearance } from "@/lib/appearance";
import { PixelGridBackground } from "./PixelGridBackground";
import { ThemeWorldBackground } from "./ThemeWorldBackground";

/** The site background: the original pixel nebula, or the theme world picked under Appearance. */
export function GlobalThemeBackground() {
  const { world } = useAppearance();
  return world === "pixel" ? <PixelGridBackground /> : <ThemeWorldBackground key={world} world={world} />;
}
