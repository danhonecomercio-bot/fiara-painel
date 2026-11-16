import { createClient } from "@supabase/supabase-js";

loadEnv();

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3] ?? "";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !email.includes("@") || password.length < 8) {
  console.error("Uso: npm run create-admin -- admin@fiara.com.br 'senha-com-8+'");
  process.exit(1);
}

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const created = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin" },
});

if (!created.error) {
  console.log(`Administrador criado: ${email}`);
  console.log("Entre no painel com esse e-mail e senha.");
  process.exit(0);
}

const existing = /already|registered|exists/i.test(created.error.message);
if (!existing) {
  console.error(created.error.message);
  process.exit(1);
}

const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listed.error) {
  console.error(listed.error.message);
  process.exit(1);
}

const user = listed.data.users.find((item) => item.email?.toLowerCase() === email);
if (!user) {
  console.error(created.error.message);
  process.exit(1);
}

const updated = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
  app_metadata: { ...(user.app_metadata ?? {}), role: "admin" },
});

if (updated.error) {
  console.error(updated.error.message);
  process.exit(1);
}

console.log(`Usuário já existia. Papel de administrador e senha atualizados: ${email}`);
console.error("Se a sessão antiga continuar aberta, saia e entre de novo para o JWT pegar o papel.");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // arquivo opcional
    }
  }
}
