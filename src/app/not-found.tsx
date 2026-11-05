import { CtaButton } from "@/components/effects/CtaButton";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-4xl font-semibold sm:text-5xl">Page not found</h1>
      <p className="max-w-md text-dim">This page does not exist yet, or the link is wrong.</p>
      <CtaButton href="/">Back to home</CtaButton>
    </main>
  );
}
