import "server-only";
import { listDemoMembers } from "./demo-members";
import { isDemoMode } from "../demo-mode";
import { createServiceClient } from "../supabase/admin";

export type MemberRow = {
  id: string;
  email: string;
  role: "admin" | "member";
  createdAt: string;
};

export async function listMembers(): Promise<MemberRow[]> {
  if (isDemoMode()) return listDemoMembers();

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw new Error(error.message);

  return data.users
    .map((user) => ({
      id: user.id,
      email: user.email ?? "sem e-mail",
      role: user.app_metadata?.role === "admin" ? ("admin" as const) : ("member" as const),
      createdAt: user.created_at,
    }))
    .sort((a, b) => a.email.localeCompare(b.email, "pt-BR"));
}
