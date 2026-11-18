import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { PASSWORD_RESET_COOKIE, PASSWORD_RESET_COOKIE_SECONDS } from "@/lib/password-reset";
import { createClient } from "@/lib/supabase/server";

/**
 * The password reset email's link lands here (src/components/auth/ForgotPasswordForm.tsx asks
 * for it). It signs the person in, then sends them to choose a new password; the cookie lets
 * that page skip asking for the password they forgot.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      (await cookies()).set(PASSWORD_RESET_COOKIE, "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: PASSWORD_RESET_COOKIE_SECONDS,
      });
      return NextResponse.redirect(`${origin}/account/password`);
    }
  }
  // No code (Supabase adds error=... instead when a link has expired), or it didn't work.
  return NextResponse.redirect(`${origin}/forgot-password?error=expired`);
}
