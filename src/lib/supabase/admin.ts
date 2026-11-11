/**
 * SERVER ONLY. A Supabase client with the service role (secret) key, which skips RLS.
 * Used only to write quiz attempts and answers after the server has graded them, so
 * members can't write their own scores. Never import this from a "use client" file.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) return null;
  // A publishable or anon key here would run as an anonymous visitor and be refused by the
  // database, which looks like a random "could not load" error. Say what is wrong instead.
  if (key.startsWith("sb_publishable_")) {
    console.error("SUPABASE_SECRET_KEY is the publishable key. Use the secret key (sb_secret_...).");
    return null;
  }
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
