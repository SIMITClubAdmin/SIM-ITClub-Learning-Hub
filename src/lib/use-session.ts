"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isGuestInBrowser } from "@/lib/guest";
import { createClient } from "@/lib/supabase/client";

const noSubscribe = () => () => {};

type HubBrowserClient = ReturnType<typeof createClient>;

/**
 * The display name on the live account, read once per page load and shared by every component
 * using this hook. The browser's copy of the session can be older than the account: a club
 * login's name is saved on the server just after they sign in (src/app/login/actions.ts). Only
 * saving a theme used to refresh it, so with the default theme the header showed "Account".
 */
let live: { userId: string; name: Promise<string> } | null = null;

function liveName(supabase: HubBrowserClient, userId: string) {
  if (live?.userId !== userId) {
    live = {
      userId,
      name: supabase.auth
        .getUser()
        .then(({ data }) => (data.user?.id === userId ? String(data.user.user_metadata?.display_name ?? "") : ""))
        .catch(() => ""),
    };
  }
  return live.name;
}

/** Whether this browser is logged in, in guest mode, or neither, and the display name. */
export function useSession() {
  // Guest mode starts and ends with a navigation; reading the pathname re-renders on each
  // one, and the cookie is read again on every render.
  usePathname();
  const guestCookie = useSyncExternalStore(noSubscribe, isGuestInBrowser, () => false);
  const [session, setSession] = useState<{ loggedIn: boolean; userId: string | null; name: string }>({
    loggedIn: false,
    userId: null,
    name: "",
  });

  useEffect(() => {
    const supabase = createClient();
    let current = true;
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      const userId = s?.user.id ?? null;
      const fromSession = String(s?.user.user_metadata?.display_name ?? "");
      // An older copy of the session may have no name yet: keep the one already known for this user.
      setSession((prev) => ({ loggedIn: !!s, userId, name: fromSession || (prev.userId === userId ? prev.name : "") }));
      if (!userId || event !== "INITIAL_SESSION") return;
      // Supabase calls must not run inside this callback, so this waits a tick.
      setTimeout(async () => {
        const name = await liveName(supabase, userId);
        if (current && name) setSession((prev) => (prev.userId === userId ? { ...prev, name } : prev));
      }, 0);
    });
    return () => {
      current = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { loggedIn: session.loggedIn, name: session.name, guest: !session.loggedIn && guestCookie };
}
