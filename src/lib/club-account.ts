import type { User } from "@supabase/supabase-js";

/**
 * Whether a login is a SIM IT Club account (subcomm, EXCO and above) rather than a hub guest.
 * The club's scripts and admin pages set app_metadata.role on every club login, and only the
 * service role can write app_metadata, so a sign-up can't claim one.
 */
export function isClubAccount(user: Pick<User, "app_metadata"> | null | undefined) {
  return !!user?.app_metadata?.role;
}
