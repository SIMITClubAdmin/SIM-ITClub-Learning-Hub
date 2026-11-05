import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  size?: "md" | "lg";
};

/** Ink block with dark text and an accent offset block that slides on hover. */
export function CtaButton({ href, children, size = "md" }: Props) {
  return (
    <Link href={href} className={size === "lg" ? "cta cta--lg" : "cta"}>
      <span className="cta__block" />
      <span className="cta__face">
        {children}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 12h15M13 5l7 7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="square"
          />
        </svg>
      </span>
    </Link>
  );
}
