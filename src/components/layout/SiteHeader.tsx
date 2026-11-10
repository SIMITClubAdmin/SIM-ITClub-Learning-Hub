"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { withProgress, type Progress } from "@/lib/progress";
import { MODULES } from "@/lib/topics";
import { useProgress } from "@/lib/use-progress";
import { NavDropdown, type NavDropdownItem } from "./NavDropdown";
import { SfxToggle } from "./SfxToggle";
import { UserMenu } from "./UserMenu";

const LEARN_ITEMS: NavDropdownItem[] = [
  { label: "HTML", href: "/learn/html" },
  { label: "CSS", href: "/learn/css" },
  { label: "JavaScript", href: "/learn/javascript" },
  { label: "CSS Playground", href: "/learn/playground" },
];

/** Lesson 1's missions, with locks opening as the member finishes them. Admins see all unlocked. */
const practiceItems = (progress: Progress): NavDropdownItem[] =>
  withProgress(MODULES, progress)[0].topics.map((topic) =>
    topic.lockedReason
      ? { label: topic.name, lockedReason: topic.lockedReason }
      : { label: topic.name, href: `/practice/${topic.slug}` },
  );

export function SiteHeader() {
  const pathname = usePathname();
  const progress = useProgress();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="relative z-40 flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
      <Link href="/" className="block">
        <Image src="/itclub-logo.png" alt="ITClub home" width={115} height={30} priority />
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-6 sm:gap-8">
        <NavDropdown label="Learn" href="/learn" active={isActive("/learn")} items={LEARN_ITEMS} />
        <NavDropdown
          label="Practice"
          href="/practice"
          active={isActive("/practice")}
          items={practiceItems(progress)}
        />
        <Link
          href="/leaderboard"
          aria-current={isActive("/leaderboard") ? "page" : undefined}
          className="relative px-0.5 py-1.5"
        >
          Leaderboard
          {isActive("/leaderboard") && (
            <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 bg-accent" />
          )}
        </Link>
        <UserMenu />
        <SfxToggle />
      </nav>
    </header>
  );
}
