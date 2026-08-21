import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const next = url.searchParams.get("next");
  const destination = new URL(next?.startsWith("/") ? next : "/marketplace", url.origin); const { url: supabaseUrl, key } = publicEnv();
  const response = NextResponse.redirect(destination);
  const supabase = createServerClient(supabaseUrl, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } });
  if (code) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)); }
  return response;
}
