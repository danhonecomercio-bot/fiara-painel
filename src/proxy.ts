import { NextResponse, type NextRequest } from "next/server";
import { readDemoSession } from "@/lib/auth/demo-session";
import { isDemoMode } from "@/lib/demo-mode";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/api/offers");

  if (isDemoMode()) {
    const session = readDemoSession(request.cookies.get("fiara_demo")?.value);
    if (pathname === "/login" && session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (!session && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!hasSupabaseBrowserEnv()) {
    if (isPublic) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
