"use client";

import { useEffect, useRef } from "react";
import { recordActivityStep } from "@/app/learn/git/actions";
import type { ActivityId } from "@/lib/activities";
import { useSession } from "@/lib/use-session";

/**
 * Saves each step of an activity to the account the first time this page sees it done
 * (done[i] is step i + 1). Only for logged-in accounts: guest mode saves nothing. A step is
 * sent once per page load; the database keeps the first time across reloads.
 */
export function useRecordSteps(activity: ActivityId, done: readonly boolean[]) {
  const { loggedIn } = useSession();
  const sent = useRef(new Set<number>());
  const key = done.map((d) => (d ? "1" : "0")).join("");

  useEffect(() => {
    if (!loggedIn) return;
    key.split("").forEach((flag, i) => {
      const step = i + 1;
      if (flag !== "1" || sent.current.has(step)) return;
      sent.current.add(step);
      void recordActivityStep(activity, step);
    });
  }, [activity, key, loggedIn]);
}
