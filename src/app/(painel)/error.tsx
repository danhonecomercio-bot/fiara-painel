"use client";

export default function PainelError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void _error;
  return (
    <div className="grid max-w-lg gap-3 rounded-md border border-line bg-panel p-4">
      <h1 className="font-display text-2xl text-gold">Não foi possível carregar o painel.</h1>
      <p className="text-sm leading-6">
        Tente de novo. Se continuar, confira a conexão com o Supabase e as variáveis de ambiente.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="h-9 w-fit rounded-md bg-gold px-3 text-sm font-semibold text-background"
      >
        Tentar de novo
      </button>
    </div>
  );
}
