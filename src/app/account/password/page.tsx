import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { createClient } from "@/lib/supabase/server";
import { PASSWORD_CHANGE_COOKIE } from "@/lib/temporary-password";

export const metadata: Metadata = { title: "Change password · ITCamp Learning Hub" };

// Needs the signed-in member, so this page renders per request.
export const instant = false;

export default async function PasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/password");

  // Set at login when a subcomm used the temporary password (see src/app/login/actions.ts).
  const forced = (await cookies()).has(PASSWORD_CHANGE_COOKIE);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <PageVeil />
      <h1 className="text-4xl font-semibold">Change your password</h1>
      {forced && (
        <p role="status" className="border border-accent bg-bg/85 px-3.5 py-3">
          You logged in with the temporary password. Choose your own to continue.
        </p>
      )}
      <PasswordForm askCurrent={!forced} />
    </main>
  );
}
