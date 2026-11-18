"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { checkPasswordChange, continueAsGuest } from "@/app/login/actions";
import { friendlyError } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase/client";

type Props = {
  mode: "login" | "register";
  initialError?: string;
  /** Where to go after logging in; already checked with safeNext. */
  next?: string;
  /** Show "Continue as a guest" under the login form. */
  allowGuest?: boolean;
};

const FIELD = "w-full border border-violet bg-bg/85 px-3.5 py-3 text-ink";
const NAME_TAKEN = "That display name is taken. Try a different one.";

export function AuthForm({ mode, initialError, next = "/", allowGuest = false }: Props) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const displayName = String(form.get("displayName") ?? "").trim();

    setError("");
    setBusy(true);
    const supabase = createClient();

    // Registering makes a learner account: the hub's lessons and challenges, nothing on the club
    // site. ITCamp subcomms already have a club login and log in with it instead.
    if (isRegister) {
      // Display names are unique (ignoring case), so check before creating the account.
      const { data: taken, error: lookupError } = await supabase.rpc("display_name_taken", { name: displayName });
      if (lookupError) {
        setError("We could not check that display name. Please try again.");
        setBusy(false);
        return;
      }
      if (taken) {
        setError(NAME_TAKEN);
        setBusy(false);
        return;
      }
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // The club database names the learner after this on their first visit.
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setBusy(false);
      if (signUpError) setError(friendlyError(signUpError.message));
      // Supabase reports success with no identities when the email is already confirmed.
      else if (signUpData.user?.identities?.length === 0) {
        setError("This email already has an account (ITCamp subcomms have their club login). Log in instead.");
      } else setSentTo(email);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setBusy(false);
      setError(friendlyError(signInError.message));
      return;
    }
    // A subcomm on the shared temporary password goes to choose their own first.
    const passwordChange = await checkPasswordChange(password);
    // That also saved their display name on the server. Refresh this browser's copy of the
    // session so the header shows the name now, whatever the theme.
    await supabase.auth.refreshSession();
    setBusy(false);
    router.push(passwordChange ?? next);
    router.refresh();
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-3" role="status">
        <h1 className="text-4xl font-semibold">Check your email</h1>
        <p className="text-dim">
          We sent a confirmation link to {sentTo}. Open it in this browser to finish signing up.
        </p>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h1 className="text-4xl font-semibold">{isRegister ? "Create your account" : "Log in"}</h1>
      {isRegister && (
        <p className="-mt-2 text-dim">
          A free learner account to read the lessons and save your challenge scores. ITCamp subcomms: you already have one, so{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            log in with your club account
          </Link>{" "}
          instead.
        </p>
      )}
      {!isRegister && <p className="-mt-2 text-dim">ITCamp subcomms: use your SIM IT Club email and password.</p>}
      {isRegister && (
        <label htmlFor="displayName" className="flex flex-col gap-2">
          Display name
          <input
            id="displayName"
            name="displayName"
            required
            minLength={2}
            maxLength={30}
            autoComplete="nickname"
            aria-describedby="displayNameHint"
            className={FIELD}
          />
          <span id="displayNameHint" className="text-sm text-dim">
            Shown in the header and on your account.
          </span>
        </label>
      )}
      <label htmlFor="email" className="flex flex-col gap-2">
        Email
        <input id="email" name="email" type="email" required autoComplete="email" className={FIELD} />
      </label>
      <label htmlFor="password" className="flex flex-col gap-2">
        Password
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={isRegister ? "new-password" : "current-password"}
          className={FIELD}
        />
        {isRegister && <span className="text-sm text-dim">At least 8 characters.</span>}
      </label>
      {!isRegister && (
        <Link href="/forgot-password" className="-mt-3 self-start text-sm text-dim underline underline-offset-4 hover:text-accent">
          Forgot password?
        </Link>
      )}
      {error && (
        <p role="alert" className="border border-accent bg-bg/85 px-3.5 py-3">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="cta cta--lg self-start disabled:opacity-60">
        {busy ? "Please wait" : isRegister ? "Create account" : "Log in"}
      </button>
      <p className="text-dim">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link href={isRegister ? "/login" : "/register"} className="text-ink underline underline-offset-4">
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
    {allowGuest && !isRegister && (
      // Not a subcomm? Guests can read the lessons and try quizzes; nothing is saved.
      <form action={continueAsGuest.bind(null, next)} className="mt-8 flex flex-col gap-3 border-t border-violet/50 pt-6">
        <p className="text-dim">Not an ITCamp subcomm? Read the lessons and try the quizzes as a guest. Nothing is saved.</p>
        <button type="submit" className="cta self-start">
          Continue as a guest
        </button>
      </form>
    )}
    </>
  );
}
