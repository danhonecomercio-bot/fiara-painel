"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signDemoSession } from "@/lib/auth/demo-session";
import { verifyDemoPassword } from "@/lib/auth/demo-members";
import { isDemoMode } from "@/lib/demo-mode";
import { hasSupabaseBrowserEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha." };

  if (isDemoMode()) {
    const member = verifyDemoPassword(email, password);
    if (!member) return { error: "E-mail ou senha incorretos." };
    const jar = await cookies();
    jar.set("fiara_demo", signDemoSession(member), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12,
    });
    redirect("/");
  }

  if (!hasSupabaseBrowserEnv()) {
    return { error: "Supabase não está configurado neste servidor." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou senha incorretos." };
  redirect("/");
}

export async function signOut() {
  if (isDemoMode()) {
    const jar = await cookies();
    jar.delete("fiara_demo");
    redirect("/login");
  }

  if (hasSupabaseBrowserEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
