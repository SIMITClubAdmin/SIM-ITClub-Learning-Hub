import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { PracticeSolarSystem } from "@/components/practice/PracticeSolarSystem";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/topics";

export const metadata: Metadata = { title: "Practice · ITCamp Learning Hub" };

// Shows a login form to logged-out visitors, so this page renders per request.
export const instant = false;

function BigLock() {
  return (
    <svg viewBox="0 0 24 24" className="size-12 text-accent" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="11" rx="1.5" fill="currentColor" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="15.5" r="1.6" fill="#070b1f" />
      <rect x="11.3" y="16" width="1.4" height="3" fill="#070b1f" />
    </svg>
  );
}

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="relative mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-4 py-2 sm:px-8">
      <h1 className="sr-only">Practice</h1>
      <div className="flex flex-1 items-center">
        {/* Grows with the screen, but never so tall that the orbits need scrolling. */}
        <div
          className={`mx-auto w-full ${user ? "" : "pointer-events-none opacity-45 select-none"}`}
          style={{ maxWidth: "calc((100svh - 130px) * 800 / 440)" }}
          inert={!user}
          aria-hidden={!user || undefined}
        >
          <PracticeSolarSystem modules={MODULES} />
        </div>
      </div>

      {!user && (
        // Logged out: the solar system shows faintly behind a locked login card.
        <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
          <section className="w-full max-w-md border border-violet bg-bg/90 p-6 shadow-[0_0_60px_10px_rgb(109_74_255_/_0.25)] sm:p-8">
            <BigLock />
            <p className="mt-4 font-mono text-xs tracking-wider text-accent uppercase">Members only</p>
            <p className="mt-1 mb-6 text-dim">Log in to unlock Practice and start your missions.</p>
            <AuthForm mode="login" next="/practice" />
          </section>
        </div>
      )}
    </main>
  );
}
