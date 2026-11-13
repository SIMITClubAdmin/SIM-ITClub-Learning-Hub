"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const CLOSE_DELAY = 150;

const ITEM = "block w-full px-3 py-2 text-left whitespace-nowrap transition-colors hover:text-accent";

export type NavDropdownItem =
  | { label: string; href: string }
  | { label: string; lockedReason: string }
  | { label: string; onSelect: () => void };

type Props = {
  label: ReactNode;
  /** Where a mouse click on the label goes. Touch and keyboard open the menu instead. */
  href?: string;
  active?: boolean;
  align?: "left" | "right";
  items: NavDropdownItem[];
};

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7h1Zm2 0h4V5a2 2 0 1 0-4 0v2Z" />
    </svg>
  );
}

/** Nav item with a menu that opens on hover, keyboard focus, Enter, Space, or tap. */
export function NavDropdown({ label, href, active = false, align = "left", items }: Props) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pointerType = useRef("");
  const skipFocusOpen = useRef(false);

  function cancelClose() {
    clearTimeout(closeTimer.current);
  }
  function show() {
    cancelClose();
    setOpen(true);
  }
  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (rootRef.current?.contains(document.activeElement)) {
        // Returning focus must not reopen the menu.
        skipFocusOpen.current = true;
        triggerRef.current?.focus();
      }
      setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function onTriggerClick(event: React.MouseEvent) {
    // detail is 0 when Enter or Space caused the click.
    if (event.detail === 0) {
      show();
    } else if (pointerType.current === "mouse") {
      // Hover has already opened it, so a mouse click keeps it open rather than toggling it shut.
      show();
    } else {
      setOpen((value) => !value);
    }
  }

  const chevron = (
    <svg
      viewBox="0 0 10 6"
      className={`nav-chevron w-2.5 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M1 1l4 4 4-4" />
    </svg>
  );
  const activeDot = active && <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 bg-(--accent-primary)" />;

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") show();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") scheduleClose();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) scheduleClose();
      }}
    >
      {href ? (
        // The label always goes to its page; the arrow beside it opens the menu.
        <div className="relative flex items-center">
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className="relative px-0.5 py-1.5"
            onClick={() => setOpen(false)}
          >
            {label}
            {activeDot}
          </Link>
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`${typeof label === "string" ? label : "More"} menu`}
            className="-mr-1.5 flex items-center self-stretch px-1.5"
            onPointerDown={(event) => {
              pointerType.current = event.pointerType;
            }}
            onClick={onTriggerClick}
          >
            {chevron}
          </button>
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-current={active ? "page" : undefined}
          className="relative flex items-center gap-1.5 px-0.5 py-1.5"
          onPointerDown={(event) => {
            pointerType.current = event.pointerType;
          }}
          onClick={onTriggerClick}
          onFocus={(event) => {
            if (skipFocusOpen.current) skipFocusOpen.current = false;
            else if (event.currentTarget.matches(":focus-visible")) show();
          }}
        >
          {label}
          {chevron}
          {activeDot}
        </button>
      )}

      {/* The top padding keeps the pointer inside the dropdown while crossing the gap. */}
      <div
        id={panelId}
        data-open={open}
        className={`nav-panel absolute top-full z-50 pt-2 ${align === "right" ? "right-0" : "left-0"}`}
      >
        <ul className="min-w-40 border border-violet bg-bg p-1.5">
          {items.map((item) => (
            <li key={item.label}>
              {"href" in item && (
                <Link href={item.href} className={ITEM} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              )}
              {"onSelect" in item && (
                <button
                  type="button"
                  className={ITEM}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  {item.label}
                </button>
              )}
              {"lockedReason" in item && <LockedItem label={item.label} reason={item.lockedReason} />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LockedItem({ label, reason }: { label: string; reason: string }) {
  const tooltipId = useId();
  return (
    <div className="group relative">
      <span
        tabIndex={0}
        data-frame
        aria-disabled="true"
        aria-describedby={tooltipId}
        className="flex items-center justify-between gap-4 px-3 py-2 whitespace-nowrap text-dim"
      >
        {label}
        <LockIcon />
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        className="nav-tooltip border border-violet bg-bg px-3 py-2 text-sm text-ink max-sm:mx-3 sm:absolute sm:top-0 sm:right-full sm:z-10 sm:mr-3 sm:w-56"
      >
        {reason}
      </span>
    </div>
  );
}
