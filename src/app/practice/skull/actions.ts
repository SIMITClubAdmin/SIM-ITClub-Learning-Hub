"use server";

import { cleanTitleIds, isTitleId, TITLES_KEY, type TitleId } from "@/lib/skull-trials";
import { createClient } from "@/lib/supabase/server";

/**
 * Saves a Skull title on the member's profile (auth user_metadata, beside their tagline), so it
 * can be equipped on the account page. The trials run in the browser's sandbox, so like the
 * tagline this is the member's own cosmetic setting, not a graded score.
 */
export async function unlockSkullTitle(id: TitleId): Promise<{ ok: boolean }> {
  if (!isTitleId(id)) return { ok: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const titles = cleanTitleIds([...cleanTitleIds(user.user_metadata?.[TITLES_KEY]), id]);
  const { error } = await supabase.auth.updateUser({ data: { [TITLES_KEY]: titles } });
  if (error) console.error("unlockSkullTitle: saving the title failed", error);
  return { ok: !error };
}
