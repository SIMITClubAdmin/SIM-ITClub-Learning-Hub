"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { setMyMentoredGroup } from "@/app/admin/progress/actions";
import { groupLabel } from "@/lib/groups";
import type { MentorGroup } from "@/lib/progress-dashboard";

/**
 * The "Change group" button and its dialog: an EXCO member picks the group they mentor. It's
 * saved in the club's mentorship records, so the club website shows the same.
 */
export function MentorGroupPicker({ groups, demo = false }: { groups: MentorGroup[]; demo?: boolean }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const current = groups.find((g) => g.mine)?.group_number ?? null;
  const [choice, setChoice] = useState<number | null>(current);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function openDialog() {
    setChoice(current);
    setError("");
    dialog.current?.showModal();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (choice === null || choice === current) {
      dialog.current?.close();
      return;
    }
    if (demo) {
      setError("This is demo data, so nothing is saved.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await setMyMentoredGroup(choice);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    dialog.current?.close();
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={openDialog} className="cta">
        {current ? "Change group" : "Choose a group"}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="mentor-group-heading"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] border border-violet bg-bg p-0 text-ink backdrop:bg-black/60"
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id="mentor-group-heading" className="text-xl font-semibold">
              The group you mentor
            </h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="p-1 text-dim hover:text-ink">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm text-dim">
            Choosing a group replaces the one you mentor now. You become its lead mentor if it has none, otherwise a co-mentor. The club
            website&apos;s Roles &amp; access page shows the same.
          </p>
          {groups.length === 0 ? (
            <p className="text-sm">There are no ITCamp groups this cohort yet.</p>
          ) : (
            <fieldset className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
              <legend className="sr-only">Groups</legend>
              {groups.map((g) => {
                const on = choice === g.group_number;
                return (
                  <label
                    key={g.group_number}
                    className={`flex cursor-pointer items-start gap-3 border px-3 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                      on ? "border-accent bg-(--accent-soft)" : "border-violet/60 hover:border-accent"
                    }`}
                  >
                    <input
                      type="radio"
                      name="group"
                      value={g.group_number}
                      checked={on}
                      onChange={() => setChoice(g.group_number)}
                      className="mt-1 accent-[var(--accent-primary)]"
                    />
                    <span className="flex flex-col">
                      <span className="font-semibold">
                        {groupLabel(g.group_number)}
                        {g.group_name ? ` · ${g.group_name}` : ""}
                        {g.mine && <span className="ml-2 font-mono text-xs text-(--accent-text) uppercase">yours</span>}
                      </span>
                      <span className="text-sm text-dim">
                        {g.mentors.length === 0 ? "No mentor yet: you'd be its lead" : `Mentors: ${g.mentors.map((n) => n || "Unnamed").join(", ")}`}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}
          {error && (
            <p role="alert" className="border border-accent px-3.5 py-3 text-sm">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy || choice === null} className="cta disabled:opacity-60">
              {busy ? "Saving" : "Save"}
            </button>
            <button type="button" onClick={() => dialog.current?.close()} className="border border-violet/60 px-4 py-2 hover:border-accent">
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
