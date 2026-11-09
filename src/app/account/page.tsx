import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/auth/AccountForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account · ITCamp Learning Hub" };

// Shows the signed-in member's own details, so this page renders per request.
export const instant = false;

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at, is_admin")
    .eq("id", user.id)
    .single();

  const joined = profile
    ? new Date(profile.created_at).toLocaleDateString("en-SG", { dateStyle: "long" })
    : "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-semibold">Your account</h1>
        {profile?.is_admin && (
          <span className="border border-accent px-2 py-0.5 font-mono text-xs tracking-wider text-accent uppercase">
            Admin
          </span>
        )}
      </div>
      {profile?.is_admin && (
        <p className="-mt-3 text-sm text-dim">
          Everything in Practice is unlocked for you, and you are kept off the leaderboard.
        </p>
      )}
      <dl className="flex flex-col gap-4 border border-violet bg-bg/85 p-5">
        <div>
          <dt className="text-sm text-dim">Email</dt>
          <dd className="break-words">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-dim">Joined</dt>
          <dd>{joined}</dd>
        </div>
      </dl>
      <AccountForm userId={user.id} initialName={profile?.display_name ?? ""} />
    </main>
  );
}
