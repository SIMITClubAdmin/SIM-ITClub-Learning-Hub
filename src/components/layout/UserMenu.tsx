"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NavDropdown } from "./NavDropdown";

const BUTTON =
  "border border-ink px-3 py-1.5 text-sm transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-bg";

/** Shows Log in for guests, or a menu under the display name for members. */
export function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
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
    <NavDropdown
      label={name || "Account"}
      href="/account"
      active={pathname === "/account"}
      align="right"
      items={[
        { label: "Profile", href: "/account" },
        { label: "Log out", onSelect: logOut },
      ]}
    />
  );
}
