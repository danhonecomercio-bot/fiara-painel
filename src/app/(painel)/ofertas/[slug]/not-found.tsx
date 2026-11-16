import Link from "next/link";

export default function OfferNotFound() {
  return (
    <div className="grid max-w-lg gap-3">
      <h1 className="font-display text-3xl text-gold">Oferta não encontrada.</h1>
      <p className="text-sm text-muted">Esse slug não está no painel.</p>
      <Link href="/" className="text-sm font-semibold text-gold hover:underline">
        Voltar às ofertas
      </Link>
    </div>
  );
}
