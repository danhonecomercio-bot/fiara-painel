import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "../demo-mode";
import { createClient } from "../supabase/server";
import { readDemoSession } from "./demo-session";

export type CurrentUser = {
  id: string;
  email: string;
  role: "admin" | "member";
};

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  if (isDemoMode()) {
    const token = (await cookies()).get("fiara_demo")?.value;
    const session = readDemoSession(token);
    if (!session) redirect("/login");
    return {
      id: `demo:${session.email}`,
      email: session.email,
      role: session.role,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");

  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  return {
    id: data.claims.sub,
    email,
    role: roleFromMetadata(data.claims.app_metadata),
  };
});

function roleFromMetadata(value: unknown): "admin" | "member" {
  if (value && typeof value === "object" && "role" in value) {
    const role = (value as { role?: unknown }).role;
    if (role === "admin") return "admin";
  }
  return "member";
}
