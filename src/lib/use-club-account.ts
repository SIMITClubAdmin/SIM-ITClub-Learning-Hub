"use client";

import { useEffect, useState } from "react";
import { isClubAccount } from "@/lib/club-account";
import { createClient } from "@/lib/supabase/client";

/** Whether the logged-in user has a club account. False for guests and logged-out visitors. */
export function useClubAccount() {
  const [club, setClub] = useState(false);

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((_event, session) => {
      setClub(isClubAccount(session?.user));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return club;
}
