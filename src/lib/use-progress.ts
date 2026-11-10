"use client";

import { useEffect, useState } from "react";
import type { Progress } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";
import { loadProgress } from "@/lib/supabase/progress";

const GUEST: Progress = { isAdmin: false, best: {} };

/** The logged-in member's admin flag and best quiz scores. Guests get no progress. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(GUEST);

  useEffect(() => {
    const supabase = createClient();
    let current = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id;
      if (!userId) {
        setProgress(GUEST);
        return;
      }
      // Run outside the auth callback, as Supabase recommends, so the query can't deadlock it.
      setTimeout(async () => {
        const loaded = await loadProgress(supabase, userId);
        if (current) setProgress(loaded);
      }, 0);
    });
    return () => {
      current = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return progress;
}
