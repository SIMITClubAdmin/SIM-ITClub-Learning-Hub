"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { setMyGroup } from "@/app/practice/actions";
import { GROUP_NUMBERS } from "@/lib/groups";

/** For members who registered before groups existed. The group can only be set once. */
export function GroupPicker() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const group = Number(new FormData(event.currentTarget).get("group"));
    setBusy(true);
    setError("");
    const result = await setMyGroup(group);
    setBusy(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border border-violet bg-bg/85 p-5">
      <p className="font-mono text-xs tracking-wider text-accent uppercase">One more step</p>
      <label htmlFor="group" className="flex flex-col gap-2">
        Your ITCamp group
        <select id="group" name="group" required defaultValue="" className="w-full border border-violet bg-bg px-3.5 py-3 text-ink">
          <option value="" disabled>
            Choose your group
          </option>
          {GROUP_NUMBERS.map((n) => (
            <option key={n} value={n}>
              Group {n}
            </option>
          ))}
        </select>
        <span className="text-sm text-dim">You can only set this once, so check with your mentor first.</span>
      </label>
      {error && (
        <p role="alert" className="border border-accent px-3.5 py-3">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="cta self-start disabled:opacity-60">
        {busy ? "Saving" : "Save my group"}
      </button>
    </form>
  );
}
