"use client";

import { useAppearance } from "@/lib/appearance";
import { MatrixRainBackground } from "./MatrixRainBackground";
import { PixelGridBackground } from "./PixelGridBackground";
import { SakuraBackground } from "./SakuraBackground";
import { WinterBackground } from "./WinterBackground";

/** The site background for the chosen theme world. */
export function GlobalThemeBackground() {
  const { world } = useAppearance();
  if (world === "matrix") return <MatrixRainBackground />;
  if (world === "sakura") return <SakuraBackground />;
  if (world === "winter") return <WinterBackground />;
  return <PixelGridBackground />;
}
