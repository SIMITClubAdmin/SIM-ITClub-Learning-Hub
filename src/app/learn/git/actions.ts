"use server";

import { isActivityStep } from "@/lib/activities";
import { createClient } from "@/lib/supabase/server";

/**
 * Saves that the signed-in learner finished a Git Studio activity step (or game level). The
 * club database keeps the first time and refuses steps the activity doesn't have. Visitors and
 * guest mode have no account, so nothing is saved for them. Never throws: a failed save must
 * not get in the way of the activity.
 */
export async function recordActivityStep(activity: string, step: number): Promise<void> {
  if (!isActivityStep(activity, step)) return;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.rpc("record_activity_step", { p_activity: activity, p_step: step });
    if (error) console.error("recordActivityStep: saving failed", error);
  } catch (error) {
    console.error("recordActivityStep: saving failed", error);
  }
}
