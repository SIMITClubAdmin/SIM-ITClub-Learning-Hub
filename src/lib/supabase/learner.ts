import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The hub's account types:
 * subcomm: an ITCamp subcomm's club login. Ranked on the leaderboard.
 * learner: registered on the hub only. Scores are saved, but they aren't ranked.
 * exco: a club login of EXCO and above. Every challenge unlocked, not ranked, sees all results.
 */
export type AccountType = "subcomm" | "learner" | "exco";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = { subcomm: "Subcomm", learner: "Learner", exco: "EXCO" };

/**
 * The club database calls a club login "member" and a hub-only login "guest" (ensure_learner
 * and get_results in the club website's repo). The hub names them here; EXCO is a member with
 * the admin flag.
 */
export function accountTypeFrom(dbType: string | null | undefined, isAdmin = false): AccountType {
  if (isAdmin) return "exco";
  return dbType === "member" || dbType === "subcomm" ? "subcomm" : "learner";
}

/** The signed-in person's learner row, from the club database's ensure_learner(). */
export type Learner = {
  display_name: string;
  account_type: AccountType;
  group_number: number | null;
  group_seat: number | null;
  /** EXCO and above: every challenge unlocked, kept off the leaderboard, sees all results. */
  is_admin: boolean;
};

type LearnerRow = Omit<Learner, "account_type"> & { account_type: string };

/** Any Supabase client of the hub's (server, browser or admin). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HubClient = SupabaseClient<any, any, any>;

/**
 * Returns the signed-in person's learner row, making it on their first visit: the club
 * database names it as they registered (or after their club profile) and gives a subcomm
 * the ITCamp group the club has for them. Null when nobody is signed in or it failed.
 */
export async function loadLearner(supabase: HubClient): Promise<Learner | null> {
  const { data, error } = await supabase.rpc("ensure_learner");
  if (error) {
    // 42501 just means nobody is signed in.
    if (error.code !== "42501") console.error("loadLearner: ensure_learner failed", error);
    return null;
  }
  const row = (Array.isArray(data) ? data[0] : data) as LearnerRow | undefined;
  return row ? { ...row, account_type: accountTypeFrom(row.account_type, row.is_admin) } : null;
}

/** Learners have no ITCamp group; club accounts (subcomms and EXCO) need one before their questions can be drawn. */
export function needsGroup(learner: Learner | null) {
  return !!learner && learner.account_type !== "learner" && !learner.group_number;
}
