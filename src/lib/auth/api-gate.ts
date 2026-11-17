export type GateDecision = "next" | "unauthorized" | "login";

export function isBotApiPath(pathname: string) {
  return (
    pathname === "/api/offers" ||
    pathname.startsWith("/api/offers/") ||
    pathname === "/api/offer-actions" ||
    pathname.startsWith("/api/offer-actions/")
  );
}

export function isApiPath(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function hasBearerAuthorization(header: string | null) {
  return Boolean(header?.startsWith("Bearer ") && header.slice("Bearer ".length).trim());
}

export function gateDecision(
  pathname: string,
  auth: { loggedIn: boolean; hasBearer: boolean },
): GateDecision {
  if (pathname.startsWith("/login")) return "next";
  if (isBotApiPath(pathname)) {
    if (auth.loggedIn || auth.hasBearer) return "next";
    return "unauthorized";
  }
  if (isApiPath(pathname)) {
    if (auth.loggedIn) return "next";
    return "unauthorized";
  }
  if (!auth.loggedIn) return "login";
  return "next";
}
