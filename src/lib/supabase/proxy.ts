import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { gateDecision, hasBearerAuthorization } from "../auth/api-gate";
import { supabaseAnonKey, supabaseUrl } from "./env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  // Nada entre o client e getClaims. A renovação do token depende disso.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;
  const decision = gateDecision(pathname, {
    loggedIn,
    hasBearer: hasBearerAuthorization(request.headers.get("authorization")),
  });

  if (decision === "unauthorized") return jsonWithSession(supabaseResponse);
  if (decision === "login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return redirectWithSession(supabaseResponse, url);
  }

  if (loggedIn && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirectWithSession(supabaseResponse, url);
  }

  return supabaseResponse;
}

function jsonWithSession(supabaseResponse: NextResponse) {
  const response = NextResponse.json(
    {
      error: "nao_autorizado",
      message: "Envie o header Authorization: Bearer <BOT_API_KEY>.",
    },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
  copySession(supabaseResponse, response);
  return response;
}

function redirectWithSession(supabaseResponse: NextResponse, url: URL) {
  const redirectResponse = NextResponse.redirect(url);
  copySession(supabaseResponse, redirectResponse);
  return redirectResponse;
}

function copySession(supabaseResponse: NextResponse, response: NextResponse) {
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(header);
    if (value) response.headers.set(header, value);
  }
}
