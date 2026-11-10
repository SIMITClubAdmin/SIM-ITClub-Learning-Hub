"use client";

import { useSfx } from "@/lib/use-sfx";

/** Sound is off until a member turns it on; the choice is remembered in this browser. */
export function SfxToggle() {
  const { soundOn, toggle } = useSfx();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={soundOn}
      aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
      className="border border-violet px-2.5 py-1 font-mono text-xs tracking-wider text-accent uppercase hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
    >
      Sound: {soundOn ? "on" : "off"}
    </button>
  );
}
