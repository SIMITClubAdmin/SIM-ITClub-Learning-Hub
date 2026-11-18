"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { friendlyError } from "@/lib/auth-errors";
import { PASSWORD_RESET_PATH } from "@/lib/password-reset";
import { createClient } from "@/lib/supabase/client";

const FIELD = "w-full border border-violet bg-bg/85 px-3.5 py-3 text-ink";

/**
 * Emails a password reset link. It says the same thing whether or not the email has an
 * account, so the form can't be used to find out who is registered.
 */
export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const [error, setError] = useState(initialError ?? "");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setError("");
    setBusy(true);
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${PASSWORD_RESET_PATH}`,
    });
    setBusy(false);
    if (resetError) setError(friendlyError(resetError.message));
    else setSentTo(email);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-3" role="status">
        <h1 className="text-4xl font-semibold">Check your email</h1>
        <p className="text-dim">
          If an account uses {sentTo}, we&apos;ve sent it a link to choose a new password. Open the link in this browser. It only
          works once, so use the newest email if you asked more than once.
        </p>
        <Link href="/login" className="self-start text-ink underline underline-offset-4">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h1 className="text-4xl font-semibold">Forgot your password?</h1>
      <p className="-mt-2 text-dim">Enter the email you log in with, and we&apos;ll send you a link to choose a new password.</p>
      <label htmlFor="email" className="flex flex-col gap-2">
        Email
        <input id="email" name="email" type="email" required autoComplete="email" className={FIELD} />
      </label>
      <p className="text-sm text-dim">
        ITCamp subcomms: this is your SIM IT Club login, so the new password works on the club website too.
      </p>
      {error && (
        <p role="alert" className="border border-accent bg-bg/85 px-3.5 py-3">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="cta cta--lg self-start disabled:opacity-60">
        {busy ? "Please wait" : "Send reset link"}
      </button>
      <p className="text-dim">
        Remembered it?{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
