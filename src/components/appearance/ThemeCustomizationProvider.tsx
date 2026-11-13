"use client";

import { useEffect } from "react";
import { setAppearanceOwner, useAppearance } from "@/lib/appearance";
import { applyToDocument, type StoredAppearance } from "@/lib/appearance-config";
import { createClient } from "@/lib/supabase/client";

/** Keeps a copy of the member's look in their Supabase profile, so every device they use gets it. */
export async function saveAppearanceToProfile(value: StoredAppearance) {
  const { error } = await createClient().auth.updateUser({ data: { hub_appearance: value } });
  return !error;
}

/**
 * Mounted once in the root layout. Keeps <html>'s appearance attributes in step with the
 * choice showing, and follows sign-in: each account gets its own saved look (the newer of
 * this browser's copy and the profile's), and signing out goes back to the guest look.
 */
export function ThemeCustomizationProvider() {
  const { font, palette, world } = useAppearance();

  useEffect(() => {
    applyToDocument({ font, palette, world });
  }, [font, palette, world]);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || (event === "INITIAL_SESSION" && !session)) {
          setAppearanceOwner(null);
          return;
        }
        if (!session || (event !== "INITIAL_SESSION" && event !== "SIGNED_IN")) return;
        const user = session.user;
        const upload = setAppearanceOwner(user.id, user.user_metadata?.hub_appearance);
        // Supabase calls must not run inside this callback, so they wait a tick.
        setTimeout(async () => {
          try {
            if (upload) await saveAppearanceToProfile(upload);
            // The session's copy of the profile can be an hour old: check the live one once.
            if (event === "INITIAL_SESSION") {
              const { data: fresh } = await supabase.auth.getUser();
              if (fresh.user?.id === user.id) setAppearanceOwner(user.id, fresh.user.user_metadata?.hub_appearance);
            }
          } catch {
            // Offline: the browser copy still applies.
          }
        }, 0);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      // No Supabase settings (local dev without .env.local): the browser copy still works.
    }
    return () => unsubscribe();
  }, []);

  return null;
}
