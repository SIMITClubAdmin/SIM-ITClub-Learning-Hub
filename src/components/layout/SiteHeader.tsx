"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";

const NAV = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
      <Link href="/" className="block">
        <Image src="/itclub-logo.png" alt="ITClub home" width={115} height={30} priority />
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-6 sm:gap-8">
        {NAV.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative px-0.5 py-1.5"
            >
              {label}
              {active && (
                <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 bg-accent" />
              )}
            </Link>
          );
        })}
        <UserMenu />
      </nav>
    </header>
  );
}
