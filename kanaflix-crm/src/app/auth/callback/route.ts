import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  const authError = request.nextUrl.searchParams.get("error");

  if (authError) {
    return NextResponse.redirect(new URL("/entrar?error=oauth_callback", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/entrar?error=oauth_callback", request.url));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/entrar?error=oauth_callback", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/entrar?error=oauth_callback", request.url));
  }

  return NextResponse.redirect(new URL(safeNext, request.url));
}
