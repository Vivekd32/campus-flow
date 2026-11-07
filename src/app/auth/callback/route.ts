import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/supabase/redirect";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const nextPath = getSafeRedirectPath(requestedNext, request.nextUrl.origin);

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=auth-callback", request.url),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("CampusFlow auth callback could not verify the code.", error.message);
    return NextResponse.redirect(
      new URL("/login?error=auth-callback", request.url),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
