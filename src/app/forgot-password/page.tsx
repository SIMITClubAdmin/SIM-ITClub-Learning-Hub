import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password · ITCamp Learning Hub" };

// The error message comes from the URL, so this page renders per request.
export const instant = false;

type Props = { searchParams: Promise<{ error?: string | string[] }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <PageVeil />
      <ForgotPasswordForm
        initialError={
          // Set by src/app/auth/reset/route.ts when a reset link doesn't work.
          error === "expired"
            ? "That reset link didn't work. It may have expired, been used already, or been opened in a different browser. Send a new one below."
            : undefined
        }
      />
    </main>
  );
}
