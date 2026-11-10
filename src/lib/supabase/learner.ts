import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Makes sure the logged-in user has a learner row in the club database, then keeps the
 * session's display name in step with it. Joining again just returns the existing row.
 */
export async function ensureLearner(supabase: SupabaseClient, user: User) {
  const meta = user.user_metadata ?? {};
  const base = String(meta.display_name || meta.full_name || user.email?.split("@")[0] || "")
    .trim()
    .slice(0, 30);

  // A taken name (23505) gets " 2", " 3" and so on, still within 30 characters.
  for (let attempt = 1; attempt <= 5; attempt++) {
    const suffix = attempt === 1 ? "" : ` ${attempt}`;
    const displayName = base.slice(0, 30 - suffix.length).trimEnd() + suffix;
    const { data, error } = await supabase.schema("learning_hub").rpc("join_hub", { display_name: displayName });
    if (error?.code === "23505") continue;
    if (error) return;

    const name: string = data?.[0]?.learner_name ?? displayName;
    if (name !== meta.display_name) await supabase.auth.updateUser({ data: { display_name: name } });
    return;
  }
}
