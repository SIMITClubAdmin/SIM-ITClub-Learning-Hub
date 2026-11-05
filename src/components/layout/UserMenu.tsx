"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUTTON = "border border-ink px-5 py-2.5";

/** Shows Log in for guests, or the display name and Log out for members. */
export function UserMenu() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      setName(session?.user.user_metadata.display_name ?? "");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function logOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!loggedIn) {
    return (
      <Link href="/login" className={BUTTON}>
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/account" className="underline underline-offset-4">
        {name || "Account"}
      </Link>
      <button type="button" onClick={logOut} className={BUTTON}>
        Log out
      </button>
    </div>
  );
}
