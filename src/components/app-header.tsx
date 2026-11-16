import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { getCurrentUser } from "@/lib/auth/session";

export async function AppHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="font-display text-2xl leading-none text-gold">
          Fiara
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-white hover:text-gold">
            Ofertas
          </Link>
          {user.role === "admin" ? (
            <Link href="/admin" className="text-white hover:text-gold">
              Membros
            </Link>
          ) : null}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="max-w-56 truncate text-muted">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="font-semibold text-gold hover:text-white">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

export function HeaderFallback() {
  return <div className="h-14 border-b border-line" />;
}
