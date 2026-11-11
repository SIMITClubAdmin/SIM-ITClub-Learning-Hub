import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { GUEST_COOKIE } from "@/lib/guest";
import { PASSWORD_CHANGE_COOKIE, PASSWORD_CHANGE_PATH } from "@/lib/temporary-password";

/**
 * Pages that need a login or guest mode: the notes (Learn) and the quizzes. /practice
 * itself shows its own locked login card, so only the quiz pages under it redirect.
 */
function needsSignIn(pathname: string) {
  return pathname === "/learn" || pathname.startsWith("/learn/") || pathname.startsWith("/practice/");
}

/**
 * Refreshes the Supabase session cookie on each page request, sends logged-out
 * visitors from members-only pages to the login page, and keeps a subcomm on the
 * change-password page until they've replaced the temporary password.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const guest = request.cookies.get(GUEST_COOKIE)?.value === "1";
  // A real login replaces guest mode.
  if (user && guest) response.cookies.delete(GUEST_COOKIE);

  if (!user && !guest && needsSignIn(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", pathname + search);
    return redirectKeepingCookies(login, response);
  }

  // A subcomm who logged in with the temporary password can only change it until they have.
  if (request.cookies.has(PASSWORD_CHANGE_COOKIE)) {
    // Logging out happens in the browser, which can't clear this cookie, so clear it here.
    if (!user) response.cookies.delete(PASSWORD_CHANGE_COOKIE);
    else if (pathname !== "/account/password" && !pathname.startsWith("/auth/")) {
      return redirectKeepingCookies(new URL(PASSWORD_CHANGE_PATH, request.url), response);
    }
  }

  return response;
}

/** Redirects, keeping any refreshed session cookies on the redirect too. */
function redirectKeepingCookies(url: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
