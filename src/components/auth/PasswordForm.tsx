"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { changePassword } from "@/app/account/password/actions";
import { CtaButton } from "@/components/effects/CtaButton";

const FIELD = "w-full border border-violet bg-bg/85 px-3.5 py-3 text-ink";

type Props = {
  /** False when a subcomm is forced here after logging in with the temporary password. */
  askCurrent: boolean;
};

export function PasswordForm({ askCurrent }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");

    const problem = await changePassword(
      String(form.get("currentPassword") ?? ""),
      String(form.get("newPassword")),
      String(form.get("confirmPassword")),
    );
    setBusy(false);
    if (problem) {
      setError(problem);
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="border border-accent bg-bg/85 px-3.5 py-3">
          Password changed. Use your new password next time you log in.
        </p>
        <div>
          <CtaButton href="/">Continue</CtaButton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {askCurrent && (
        <label htmlFor="currentPassword" className="flex flex-col gap-2">
          Current password
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className={FIELD}
          />
        </label>
      )}
      <label htmlFor="newPassword" className="flex flex-col gap-2">
        New password
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          aria-describedby="newPasswordHint"
          className={FIELD}
        />
        <span id="newPasswordHint" className="text-sm text-dim">
          At least 10 characters.
        </span>
      </label>
      <label htmlFor="confirmPassword" className="flex flex-col gap-2">
        Confirm new password
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          className={FIELD}
        />
      </label>
      {error && (
        <p role="alert" className="border border-accent bg-bg/85 px-3.5 py-3">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="cta self-start disabled:opacity-60">
        {busy ? "Saving" : "Change password"}
      </button>
    </form>
  );
}
