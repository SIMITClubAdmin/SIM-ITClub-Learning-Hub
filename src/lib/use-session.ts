"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isGuestInBrowser } from "@/lib/guest";
import { createClient } from "@/lib/supabase/client";

const noSubscribe = () => () => {};

/** Whether this browser is logged in, in guest mode, or neither. */
export function useSession() {
  // Guest mode starts and ends with a navigation; reading the pathname re-renders on each
  // one, and the cookie is read again on every render.
  usePathname();
  const guestCookie = useSyncExternalStore(noSubscribe, isGuestInBrowser, () => false);
  const [session, setSession] = useState({ loggedIn: false, name: "" });

  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((_event, s) => {
      setSession({ loggedIn: !!s, name: s?.user.user_metadata.display_name ?? "" });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { ...session, guest: !session.loggedIn && guestCookie };
}
