"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { leaveGuestMode } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/use-session";
import { NavDropdown } from "./NavDropdown";

const BUTTON =
  "border border-ink px-3 py-1.5 text-sm transition-colors duration-200 hover:border-accent hover:bg-(--accent-primary) hover:text-(--accent-on-primary)";

/** Log in for visitors, a Guest menu in guest mode, or a menu under the display name for members. */
export function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { loggedIn, guest, name } = useSession();

  async function logOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function leaveGuest() {
    await leaveGuestMode();
    router.push("/");
    router.refresh();
  }

  if (guest) {
    return (
      <NavDropdown
        label="Guest"
        href="/login"
        active={false}
        align="right"
        items={[
          { label: "Log in", href: "/login" },
          { label: "Create an account", href: "/register" },
          { label: "Appearance", href: "/appearance" },
          { label: "Leave guest mode", onSelect: leaveGuest },
        ]}
      />
    );
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
        { label: "Appearance", href: "/account#appearance" },
        { label: "Log out", onSelect: logOut },
      ]}
    />
  );
}
