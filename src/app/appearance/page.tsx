import type { Metadata } from "next";
import Link from "next/link";
import { AppearanceSettings } from "@/components/appearance/AppearanceSettings";
import { PageVeil } from "@/components/layout/PageVeil";

export const metadata: Metadata = { title: "Appearance · ITCamp Learning Hub" };

/** The same settings as on Your account, for guests and visitors who have no account page. */
export default function AppearancePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <PageVeil />
      <h1 className="text-4xl font-semibold">Appearance</h1>
      <p className="-mt-3 text-sm text-dim">
        Pick a font, colours and a theme world. They are saved in this browser.{" "}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Log in
        </Link>{" "}
        to keep them on your profile too.
      </p>
      <AppearanceSettings signedIn={false} />
    </main>
  );
}
