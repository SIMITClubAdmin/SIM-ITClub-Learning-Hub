import type { SupabaseClient } from "@supabase/supabase-js";
import { bestScores, type Progress } from "@/lib/progress";

/** The member's admin flag and best quiz scores. Works with the server or browser client. */
export async function loadProgress(supabase: SupabaseClient, userId: string): Promise<Progress> {
  const hub = supabase.schema("learning_hub");
  const [{ data: isAdmin }, { data: attempts }] = await Promise.all([
    hub.rpc("is_hub_admin"),
    hub.from("quiz_attempts").select("quiz_slug:topic_slug, score, total").eq("user_id", userId),
  ]);
  return { isAdmin: !!isAdmin, best: bestScores(attempts ?? []) };
}
