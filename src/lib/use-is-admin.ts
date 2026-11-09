"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Whether the logged-in member is an admin. False while loading and for guests. */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let current = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id;
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      // Run outside the auth callback, as Supabase recommends, so the query can't deadlock it.
      setTimeout(async () => {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();
        if (current) setIsAdmin(!!profile?.is_admin);
      }, 0);
    });
    return () => {
      current = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return isAdmin;
}
