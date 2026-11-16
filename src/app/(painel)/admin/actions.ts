"use server";

import { revalidatePath } from "next/cache";
import { addDemoMember } from "@/lib/auth/demo-members";
import { getCurrentUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo-mode";
import { createServiceClient } from "@/lib/supabase/admin";

export type MemberState = { error?: string; ok?: string };

export async function createMember(_previous: MemberState, formData: FormData): Promise<MemberState> {
  const user = await getCurrentUser();
  if (user.role !== "admin") return { error: "Só um administrador cria membros." };

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "member";
  const mode = formData.get("mode") === "convite" ? "convite" : "senha";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Informe um e-mail válido." };
  }

  if (isDemoMode()) {
    if (mode === "convite") {
      return { error: "Convite por e-mail precisa do Supabase. Neste ambiente, crie com senha." };
    }
    if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
    const result = addDemoMember({ email, password, role });
    revalidatePath("/admin");
    return result;
  }

  const admin = createServiceClient();

  if (mode === "convite") {
    const invited = await admin.auth.admin.inviteUserByEmail(email);
    if (invited.error || !invited.data.user) {
      return { error: invited.error?.message ?? "Não foi possível enviar o convite." };
    }
    const updated = await admin.auth.admin.updateUserById(invited.data.user.id, {
      app_metadata: { role },
    });
    if (updated.error) return { error: updated.error.message };
    revalidatePath("/admin");
    return { ok: "Convite enviado. O papel ficou em app_metadata, não no perfil editável pelo usuário." };
  }

  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (created.error) return { error: created.error.message };
  revalidatePath("/admin");
  return { ok: "Membro criado. A pessoa já pode entrar com essa senha." };
}
