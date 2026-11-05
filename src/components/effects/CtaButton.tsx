import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  size?: "md" | "lg";
};

/** Flat accent button with mono uppercase text; a dark fill wipes across on hover. */
export function CtaButton({ href, children, size = "md" }: Props) {
  return (
    <Link href={href} className={size === "lg" ? "cta cta--lg" : "cta"}>
      {children}
    </Link>
  );
}
