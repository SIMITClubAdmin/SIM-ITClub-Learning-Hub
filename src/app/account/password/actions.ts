"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isTemporaryPassword, PASSWORD_CHANGE_COOKIE } from "@/lib/temporary-password";

/** Same limits as the club site, since it's the same account. */
const MIN_LENGTH = 10;
const MAX_LENGTH = 72;

/**
 * Sets a new password. Normally the current password is checked first, so someone at an
 * unlocked device can't lock the owner out. A subcomm forced here after logging in with
 * the shared temporary password skips that: the server only sets the cookie once it has
 * seen that password, and everyone knows it anyway.
 * Returns a message to show, or null once the password is changed.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const forced = cookieStore.has(PASSWORD_CHANGE_COOKIE);

  if (!forced && !currentPassword) return "Enter your current password.";
  if (newPassword.length < MIN_LENGTH) return `Use at least ${MIN_LENGTH} characters.`;
  if (newPassword.length > MAX_LENGTH) return `Use ${MAX_LENGTH} characters or fewer.`;
  if (newPassword !== confirmPassword) return "The two new passwords do not match.";
  if (!forced && newPassword === currentPassword) {
    return "Choose a password that is different from your current one.";
  }
  if (isTemporaryPassword(newPassword)) return "Choose your own password, not the temporary one.";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return "Log in again, then change your password.";

  if (!forced) {
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (check.error) return "Your current password is not right.";
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return `We could not change your password: ${error.message}`;

  // They have their own password now, so the rest of the hub opens again.
  cookieStore.delete(PASSWORD_CHANGE_COOKIE);
  return null;
}
