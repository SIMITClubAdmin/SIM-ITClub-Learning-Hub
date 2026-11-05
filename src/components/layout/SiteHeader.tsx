"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";

const NAV = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
      <Link href="/" className="border border-ink px-3 py-2 font-display text-lg">
        ITCAMP
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
