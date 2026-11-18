"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isGuestInBrowser } from "@/lib/guest";
import { createClient } from "@/lib/supabase/client";

const noSubscribe = () => () => {};

type HubBrowserClient = ReturnType<typeof createClient>;
type LiveAccount = { name: string; exco: boolean };

/**
 * The live account, read once per user and page load and shared by every component using this
 * hook: its display name and whether it's EXCO (the header then shows the Dashboard tab).
 * The browser's copy of the session can be older than the account: a club login's name is
 * saved on the server just after they sign in (src/app/login/actions.ts). Only saving a theme
 * used to refresh it, so with the default theme the header showed "Account".
 */
let live: { userId: string; account: Promise<LiveAccount> } | null = null;

function liveAccount(supabase: HubBrowserClient, userId: string) {
  if (live?.userId !== userId) {
    const name = supabase.auth
      .getUser()
      .then(({ data }) => (data.user?.id === userId ? String(data.user.user_metadata?.display_name ?? "") : ""))
      .catch(() => "");
    // EXCO and above, as the club database decides (learning_hub.is_hub_admin).
    const exco = Promise.resolve(supabase.rpc("is_hub_admin"))
      .then(({ data }) => data === true)
      .catch(() => false);
    live = { userId, account: Promise.all([name, exco]).then(([n, e]) => ({ name: n, exco: e })) };
  }
  return live.account;
}

/** Whether this browser is logged in, in guest mode, or neither; the display name; and whether it's EXCO. */
export function useSession() {
  // Guest mode starts and ends with a navigation; reading the pathname re-renders on each
  // one, and the cookie is read again on every render.
  usePathname();
  const guestCookie = useSyncExternalStore(noSubscribe, isGuestInBrowser, () => false);
  const [session, setSession] = useState<{ loggedIn: boolean; userId: string | null; name: string; exco: boolean }>({
    loggedIn: false,
    userId: null,
    name: "",
    exco: false,
  });

  useEffect(() => {
    const supabase = createClient();
    let current = true;
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      const userId = s?.user.id ?? null;
      const fromSession = String(s?.user.user_metadata?.display_name ?? "");
      // An older copy of the session may have no name yet: keep what's already known for this user.
      setSession((prev) => {
        const same = prev.userId === userId;
        return { loggedIn: !!s, userId, name: fromSession || (same ? prev.name : ""), exco: same ? prev.exco : false };
      });
      if (!userId || (event !== "INITIAL_SESSION" && event !== "SIGNED_IN")) return;
      // Supabase calls must not run inside this callback, so this waits a tick.
      setTimeout(async () => {
        const account = await liveAccount(supabase, userId);
        if (!current) return;
        setSession((prev) => (prev.userId === userId ? { ...prev, name: account.name || prev.name, exco: account.exco } : prev));
      }, 0);
    });
    return () => {
      current = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { loggedIn: session.loggedIn, name: session.name, exco: session.loggedIn && session.exco, guest: !session.loggedIn && guestCookie };
}
