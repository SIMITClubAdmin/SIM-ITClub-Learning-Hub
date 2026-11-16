"use server";

import { cleanTitleIds, isTitleId, skullTitle, TITLES_KEY, type TitleId } from "@/lib/skull-trials";
import { createClient } from "@/lib/supabase/server";

export type UnlockResult = { ok: true } | { ok: false; reason: "signed-out" | "locked" | "error" };

/**
 * Saves a Skull title on the member's profile (auth user_metadata, beside their tagline), so it
 * can be equipped on the account page. A tier is only saved once the tier before it is on the
 * profile (Advanced needs Intermediate, Expert needs Advanced), so locked tiers can't be skipped.
 * The trials run in the browser's sandbox, so like the tagline this is the member's own cosmetic
 * setting, not a graded score.
 */
export async function unlockSkullTitle(id: TitleId): Promise<UnlockResult> {
  if (!isTitleId(id)) return { ok: false, reason: "error" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "signed-out" };
  const saved = cleanTitleIds(user.user_metadata?.[TITLES_KEY]);
  if (saved.includes(id)) return { ok: true };
  const needs = skullTitle(id).requires;
  if (needs && !saved.includes(needs)) return { ok: false, reason: "locked" };
  const { error } = await supabase.auth.updateUser({ data: { [TITLES_KEY]: cleanTitleIds([...saved, id]) } });
  if (error) {
    console.error("unlockSkullTitle: saving the title failed", error);
    return { ok: false, reason: "error" };
  }
  return { ok: true };
}
