import { PageVeil } from "@/components/layout/PageVeil";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ProgressDashboard } from "@/components/admin/progress/ProgressDashboard";
import { toMember, type MentorGroup, type ProgressRow } from "@/lib/progress-dashboard";
import { demoProgress } from "@/lib/progress-demo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Progress dashboard · ITCamp Learning Hub" };
export const instant = false;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <PageVeil />
      <h1 className="text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-dim">{children}</p>
      <Link href="/account" className="cta mt-6">
        Back to your account
      </Link>
    </main>
  );
}

/** EXCO only: the progress of the groups they mentor, and of every subcomm. */
export default async function ProgressPage({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const view = params.view === "all" ? "all" : params.view === "mine" ? "mine" : null;
  const now = new Date().toISOString();

  // Made-up members to preview the layout in development, before real progress exists.
  if (params.demo !== undefined && process.env.NODE_ENV !== "production") {
    const demo = demoProgress(now);
    return <ProgressDashboard key={view ?? "mine"} members={demo.rows.map(toMember)} groups={demo.groups} view={view ?? "mine"} now={now} demo />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/progress");

  const [progress, mentorGroups] = await Promise.all([supabase.rpc("get_member_progress"), supabase.rpc("get_mentor_groups")]);
  if (progress.error) {
    if (progress.error.code === "42501") return <Notice title="Progress dashboard">This page is for EXCO only.</Notice>;
    if (progress.error.code === "PGRST202") {
      return <Notice title="Progress dashboard">The database update for this page isn&apos;t applied yet.</Notice>;
    }
    console.error("progress dashboard: loading failed", progress.error);
    return <Notice title="Progress dashboard">The progress couldn&apos;t be loaded. Please refresh the page.</Notice>;
  }

  const groups = (mentorGroups.data ?? []) as MentorGroup[];
  // Mentors start on their own groups; everyone else on all subcomms.
  const initialView = view ?? (groups.some((g) => g.mine) ? "mine" : "all");
  return (
    // A new view starts with its filters cleared.
    <ProgressDashboard key={initialView} members={((progress.data ?? []) as ProgressRow[]).map(toMember)} groups={groups} view={initialView} now={now} />
  );
}
