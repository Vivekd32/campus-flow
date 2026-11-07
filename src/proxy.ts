import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

const privateRoute = /^\/(dashboard|projects|tasks|activity|notifications|calendar|settings|documents|invitations)(\/|$)/;

export async function proxy(request: NextRequest) {
  const isHomeRoute = request.nextUrl.pathname === "/";
  const isPrivateRoute = privateRoute.test(request.nextUrl.pathname);
  if (!isSupabaseConfigured()) {
    if (!isPrivateRoute && !isHomeRoute) return NextResponse.next();
    const login = new URL("/login", request.url);
    login.searchParams.set("error", "backend-unconfigured");
    if (isPrivateRoute) {
      login.searchParams.set("next", request.nextUrl.pathname);
    }
    return NextResponse.redirect(login);
  }

  const { response, authenticated } = await updateSession(request);
  if (isHomeRoute) {
    return copyCookies(
      response,
      NextResponse.redirect(
        new URL(authenticated ? "/dashboard" : "/login", request.url),
      ),
    );
  }
  if (isPrivateRoute && !authenticated) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return copyCookies(response, NextResponse.redirect(login));
  }
  if (
    authenticated &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    return copyCookies(
      response,
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }
  return response;
}

function copyCookies(source: NextResponse, destination: NextResponse) {
  source.cookies.getAll().forEach((cookie) =>
    destination.cookies.set(cookie),
  );
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) destination.headers.set(header, value);
  }
  return destination;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/activity",
    "/notifications",
    "/calendar",
    "/settings/:path*",
    "/documents/:path*",
    "/invitations",
    "/login",
    "/register",
  ],
};
