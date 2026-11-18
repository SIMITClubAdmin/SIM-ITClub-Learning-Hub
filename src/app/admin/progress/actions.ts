"use server";

import { createClient } from "@/lib/supabase/server";

export type MentorChange = { ok: true } | { ok: false; error: string };

/**
 * An EXCO member chooses the group they mentor this cohort. The club database checks they are
 * EXCO, replaces their current mentorship, makes them lead only if the group has none, and
 * records the change in its audit log, so the club website's Roles & access page agrees.
 */
export async function setMyMentoredGroup(group: number): Promise<MentorChange> {
  if (!Number.isInteger(group) || group < 1 || group > 30) return { ok: false, error: "Choose a group." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Log in again, then try once more." };

  const { error } = await supabase.rpc("set_my_mentored_group", { group_no: group });
  if (!error) return { ok: true };
  if (error.code === "42501") return { ok: false, error: "Only EXCO can mentor a group." };
  if (error.code === "P0002") return { ok: false, error: "That group doesn't exist this cohort." };
  if (error.code === "PGRST202") return { ok: false, error: "The database update for this page isn't applied yet." };
  console.error("setMyMentoredGroup failed", error);
  return { ok: false, error: "Your group couldn't be changed. Please try again." };
}
