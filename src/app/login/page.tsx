import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Log in · ITCamp Learning Hub" };

// The error message comes from the URL, so this page renders per request.
export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <AuthForm
        mode="login"
        initialError={
          error === "confirm"
            ? "That confirmation link did not work. It may have expired, or been opened in a different browser. Try logging in."
            : undefined
        }
      />
    </main>
  );
}
