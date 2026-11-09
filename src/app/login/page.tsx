import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Log in · ITCamp Learning Hub" };

// The error message comes from the URL, so this page renders per request.
export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, next } = await searchParams;
  const goTo = safeNext(next);
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      {goTo.startsWith("/practice") && (
        <p className="mb-6 border border-violet bg-bg/85 px-3.5 py-3">
          Practice is for members. Log in or create an account to start your missions.
        </p>
      )}
      <AuthForm
        mode="login"
        next={goTo}
        initialError={
          error === "confirm"
            ? "That confirmation link did not work. It may have expired, or been opened in a different browser. Try logging in."
            : undefined
        }
      />
    </main>
  );
}
