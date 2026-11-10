"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  isSubcomm,
  isTemporaryPassword,
  PASSWORD_CHANGE_COOKIE,
  PASSWORD_CHANGE_COOKIE_SECONDS,
  PASSWORD_CHANGE_PATH,
} from "@/lib/temporary-password";

/**
 * Runs right after a successful login. A subcomm who used the shared temporary password
 * must choose their own first, so this returns the change-password page for them, and
 * null for everyone else.
 */
export async function checkPasswordChange(password: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();

  if (user && isSubcomm(user) && isTemporaryPassword(password)) {
    cookieStore.set(PASSWORD_CHANGE_COOKIE, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: PASSWORD_CHANGE_COOKIE_SECONDS,
    });
    return PASSWORD_CHANGE_PATH;
  }
  // Their own password: drop any leftover reminder from an earlier login.
  cookieStore.delete(PASSWORD_CHANGE_COOKIE);
  return null;
}
