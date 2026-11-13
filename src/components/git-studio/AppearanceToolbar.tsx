"use client";

import { Type } from "lucide-react";
import { FONTS, THEMES, useAppearance, type FontId } from "./appearance";

/** Font and colour theme for the Git page, remembered in this browser. */
export function AppearanceToolbar() {
  const { theme, font, setTheme, setFont } = useAppearance();

  return (
    <div className="gs-card flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-2.5" role="group" aria-label="Appearance">
      <label className="flex items-center gap-2">
        <Type className="size-4 text-(--text-muted)" aria-hidden="true" />
        <span className="gs-label">Font</span>
        <select
          value={font}
          onChange={(e) => setFont(e.target.value as FontId)}
          className="gs-ui rounded border border-(--border-subtle) bg-(--bg-panel) px-2 py-1 text-[13px] text-(--text-main) outline-none focus:border-(--accent-primary)"
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Colour theme">
        <span className="gs-label">Theme</span>
        {THEMES.map((t) => {
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={t.label}
              title={t.label}
              onClick={() => setTheme(t.id)}
              className={`flex size-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
                active ? "border-(--accent-primary)" : "border-(--border-subtle)"
              }`}
            >
              {/* Half base colour, half accent. */}
              <span
                className="block size-5 rounded-full"
                style={{ background: `linear-gradient(135deg, ${t.base} 0 50%, ${t.accent} 50% 100%)`, boxShadow: "inset 0 0 0 1px rgb(127 127 127 / 0.35)" }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
