"use client";

import { useState, type FormEvent } from "react";
import { cleanTagline, TAGLINE_MAX } from "@/lib/leaderboard";
import { useLocalTitles } from "@/lib/skull-titles-store";
import { cleanTitleIds, EQUIPPED_KEY, SKULL_TITLES, skullTitle, titleText, TITLES_KEY, type TitleId } from "@/lib/skull-trials";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  initialName: string;
  /** Shown under their name on the leaderboard while they are in the top 3. */
  initialTagline: string;
  /** Admins are kept off the leaderboard. */
  onLeaderboard: boolean;
  /** Skull titles saved on the profile. Titles unlocked in this browser are added on top. */
  unlockedTitles: TitleId[];
  initialTitle: TitleId | null;
};

export function AccountForm({ userId, initialName, initialTagline, onLeaderboard, unlockedTitles, initialTitle }: Props) {
  const local = useLocalTitles(userId);
  const unlocked = cleanTitleIds([...unlockedTitles, ...local]);
  const [title, setTitle] = useState<TitleId | "">(initialTitle ?? "");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  function show(text: string, error: boolean) {
    setMessage(text);
    setIsError(error);
    setBusy(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName")).trim();
    const tagline = cleanTagline(form.get("tagline"));
    setBusy(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("learners").update({ display_name: displayName }).eq("user_id", userId);
    if (error) {
      show(
        error.code === "23505"
          ? "That display name is taken. Try a different one."
          : error.code === "23514"
            ? "Use 2 to 30 characters."
            : "We could not save your display name. Please try again.",
        true,
      );
      return;
    }
    // The header reads the name from the session, so keep it in step. The tagline lives in the
    // profile too, where the leaderboard reads it for the top 3.
    // Skull titles live there too: every title unlocked so far, and the one to show.
    const equipped = title && unlocked.includes(title) ? title : null;
    const { error: profileError } = await supabase.auth.updateUser({
      data: { display_name: displayName, hub_tagline: tagline, [TITLES_KEY]: unlocked, [EQUIPPED_KEY]: equipped },
    });
    if (profileError) {
      show("Your display name was saved, but not your tagline or title. Please try again.", true);
      return;
    }
    show(tagline || equipped ? "Your account settings are saved." : "Display name saved.", false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label htmlFor="displayName" className="flex flex-col gap-2">
        Display name
        <input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          maxLength={30}
          defaultValue={initialName}
          autoComplete="nickname"
          className="w-full border border-violet bg-bg/85 px-3.5 py-3 text-ink"
        />
        <span className="text-sm text-dim">
          {onLeaderboard ? "Shown on the leaderboard, which anyone logged in can see." : "Shown in the header and on your account."}
        </span>
      </label>
      <label htmlFor="tagline" className="flex flex-col gap-2">
        Leaderboard tagline
        <input
          id="tagline"
          name="tagline"
          maxLength={TAGLINE_MAX}
          defaultValue={initialTagline}
          placeholder="e.g. Commit early, push often"
          autoComplete="off"
          className="w-full border border-violet bg-bg/85 px-3.5 py-3 text-ink"
        />
        <span className="text-sm text-dim">
          Displayed under your name on the Leaderboard when you place in the Top 3 (#1, #2, or #3). Up to {TAGLINE_MAX} characters.
          {!onLeaderboard && " Your account is kept off the leaderboard, so it won't show there."}
        </span>
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2">Equipped Skull Title</legend>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-3 border border-violet/60 bg-bg/85 px-3.5 py-2.5">
            <input type="radio" name="skullTitle" value="" checked={title === ""} onChange={() => setTitle("")} />
            <span>No title</span>
          </label>
          {SKULL_TITLES.map((t) => {
            const open = unlocked.includes(t.id);
            return (
              <label
                key={t.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 border px-3.5 py-2.5 ${open ? "border-violet/60 bg-bg/85" : "border-grid bg-bg/60 opacity-60"}`}
              >
                <input type="radio" name="skullTitle" value={t.id} checked={title === t.id} disabled={!open} onChange={() => setTitle(t.id)} />
                <span className={open ? "font-mono text-(--accent-text)" : "font-mono text-dim"}>{titleText(t.id)}</span>
                {!open && (
                  <span className="text-sm text-dim">
                    🔒 Solve Optional Skull Trial {t.trial} to unlock
                    {t.requires && ` (it opens after Skull Trial ${skullTitle(t.requires).trial})`}
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <span className="text-sm text-dim">
          Your equipped Skull Title is displayed next to your name on the Leaderboard when you are in the Top 3 (#1, #2, or #3).
        </span>
      </fieldset>
      {message && (
        <p role={isError ? "alert" : "status"} className="border border-accent bg-bg/85 px-3.5 py-3">
          {message}
        </p>
      )}
      <button type="submit" disabled={busy} className="cta self-start disabled:opacity-60">
        {busy ? "Saving" : "Save changes"}
      </button>
    </form>
  );
}
