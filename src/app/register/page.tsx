import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Register · ITCamp Learning Hub" };

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <PageVeil />
      <AuthForm mode="register" />
    </main>
  );
}
