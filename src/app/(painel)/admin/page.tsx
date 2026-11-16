import { MemberForm } from "./member-form";
import { listMembers } from "@/lib/auth/members";
import { getCurrentUser } from "@/lib/auth/session";
import { formatSaoPauloDate } from "@/lib/offers/format";
import { isDemoMode } from "@/lib/demo-mode";

export const metadata = { title: "Membros" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (user.role !== "admin") {
    return (
      <div className="grid max-w-lg gap-2">
        <h1 className="font-display text-3xl text-gold">Membros</h1>
        <p>Só administradores criam contas. Peça acesso a quem já administra o painel.</p>
      </div>
    );
  }

  const members = await listMembers();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="grid gap-3">
        <h1 className="font-display text-3xl text-gold">Membros</h1>
        <p className="text-sm leading-6 text-muted">
          Não há cadastro público. O papel fica em app_metadata, que o próprio usuário não edita.
        </p>
        {isDemoMode() ? (
          <p className="rounded-md border border-gold/40 bg-panel px-3 py-2 text-sm">
            Ambiente de demonstração. Membros criados aqui ficam só na memória deste processo.
          </p>
        ) : null}
        <ul className="divide-y divide-line rounded-md border border-line">
          {members.map((member) => (
            <li key={member.id} className="grid gap-0.5 px-3 py-2 text-sm">
              <span className="font-semibold">{member.email}</span>
              <span className="text-muted">
                {member.role === "admin" ? "Administrador" : "Membro"} · desde{" "}
                {formatSaoPauloDate(member.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-md border border-line bg-panel p-4">
        <h2 className="font-subtitle mb-4 text-2xl text-gold">Novo membro</h2>
        <MemberForm />
      </section>
    </div>
  );
}
