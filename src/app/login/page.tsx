import { LoginForm } from "./login-form";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/auth/demo-members";
import { isDemoMode } from "@/lib/demo-mode";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  const demo = isDemoMode();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div className="grid gap-2">
        <p className="font-display text-4xl text-gold">Fiara</p>
        <h1 className="text-xl font-semibold">Painel de ofertas</h1>
        <p className="text-sm leading-6 text-muted">
          Acesso restrito a membros. Não há cadastro público: um administrador cria a conta.
        </p>
      </div>
      <div className="rounded-md border border-line bg-panel p-4">
        <LoginForm demoHint={demo ? { email: DEMO_EMAIL, password: DEMO_PASSWORD } : null} />
      </div>
      {demo ? (
        <p className="text-sm leading-6 text-muted">
          Ambiente de demonstração, sem Supabase. Entre com {DEMO_EMAIL} e a senha {DEMO_PASSWORD}.
          Os três anúncios da lista são dados de exemplo.
        </p>
      ) : null}
    </main>
  );
}
