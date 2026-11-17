import { NextResponse, type NextRequest } from "next/server";
import { gateDecision, hasBearerAuthorization } from "@/lib/auth/api-gate";
import { readDemoSession } from "@/lib/auth/demo-session";
import { isDemoMode } from "@/lib/demo-mode";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

function unauthorized() {
  return NextResponse.json(
    {
      error: "nao_autorizado",
      message: "Envie o header Authorization: Bearer <BOT_API_KEY>.",
    },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
}

function applyGate(request: NextRequest, loggedIn: boolean) {
  const decision = gateDecision(request.nextUrl.pathname, {
    loggedIn,
    hasBearer: hasBearerAuthorization(request.headers.get("authorization")),
  });
  if (decision === "unauthorized") return unauthorized();
  if (decision === "login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDemoMode()) {
    const session = readDemoSession(request.cookies.get("fiara_demo")?.value);
    if (pathname === "/login" && session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return applyGate(request, Boolean(session)) ?? NextResponse.next();
  }

  if (!hasSupabaseBrowserEnv()) {
    return applyGate(request, false) ?? NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
