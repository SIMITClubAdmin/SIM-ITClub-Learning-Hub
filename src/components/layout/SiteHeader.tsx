"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/use-session";
import { SfxToggle } from "./SfxToggle";
import { UserMenu } from "./UserMenu";

export function SiteHeader() {
  const pathname = usePathname();
  // The leaderboard is for registered members only, so guests don't get the link.
  const { loggedIn } = useSession();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Plain links: each one goes straight to its page.
  const links = [
    { href: "/learn", label: "Learn", show: true },
    { href: "/practice", label: "Challenge", show: true },
    { href: "/leaderboard", label: "Leaderboard", show: loggedIn },
  ];

  return (
    <header className="relative z-40 flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
      <Link href="/" className="block">
        <Image src="/itclub-logo.png" alt="ITClub home" width={115} height={30} priority />
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-6 sm:gap-8">
        {links
          .filter((l) => l.show)
          .map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className="relative px-0.5 py-1.5"
            >
              {label}
              {isActive(href) && <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 bg-accent" />}
            </Link>
          ))}
        <UserMenu />
        <SfxToggle />
      </nav>
    </header>
  );
}
