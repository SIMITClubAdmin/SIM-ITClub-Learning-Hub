import type { SupabaseClient } from "@supabase/supabase-js";
import { bestScores, type Progress } from "@/lib/progress";

/** The member's admin flag and best quiz scores. Works with the server or browser client. */
export async function loadProgress(supabase: SupabaseClient, userId: string): Promise<Progress> {
  const [{ data: profile }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", userId).single(),
    supabase.from("quiz_attempts").select("quiz_slug, score, total").eq("user_id", userId),
  ]);
  return { isAdmin: !!profile?.is_admin, best: bestScores(attempts ?? []) };
}
