"use client";

import { useAppearance } from "@/lib/appearance";
import { MatrixRainBackground } from "./MatrixRainBackground";
import { PixelGridBackground } from "./PixelGridBackground";

/** The site background: the original pixel grid, or the Code theme's matrix rain. */
export function GlobalThemeBackground() {
  const { world } = useAppearance();
  return world === "matrix" ? <MatrixRainBackground /> : <PixelGridBackground />;
}
