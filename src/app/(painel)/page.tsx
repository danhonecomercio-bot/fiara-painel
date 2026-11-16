import { OfferFilters } from "@/components/offer-filters";
import { OfferList } from "@/components/offer-list";
import { listOfferCards } from "@/lib/data/read-offers";
import { filterAndSort, parseFilters } from "@/lib/offers/query";

export const metadata = { title: "Ofertas" };

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const cards = await listOfferCards();
  const filters = parseFilters(params);
  const offers = filterAndSort(cards, filters);
  const niches = unique(cards.map((card) => card.niche).filter((value): value is string => Boolean(value)));
  const languages = unique(
    cards.map((card) => card.language_country).filter((value): value is string => Boolean(value)),
  );
  for (const nicho of filters.nicho) {
    if (!niches.includes(nicho)) niches.push(nicho);
  }
  for (const idioma of filters.idioma) {
    if (!languages.includes(idioma)) languages.push(idioma);
  }
  niches.sort((a, b) => a.localeCompare(b, "pt-BR"));
  languages.sort((a, b) => a.localeCompare(b, "pt-BR"));

  const ads = offers.reduce((sum, offer) => sum + (offer.total_active_ads ?? 0), 0);
  const altas = offers.filter((offer) => (offer.opportunity_score ?? -1) >= 4).length;
  const examples = cards.some((card) => card.is_example);

  return (
    <div className="grid gap-5">
      <header className="grid gap-2">
        <h1 className="font-display text-3xl text-gold sm:text-4xl">Ofertas em escala</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          Anúncios ativos minerados da Biblioteca da Meta. Leituras às 7h e às 22h, horário de Brasília.
          ⭐ acima de 500 anúncios. 🔥 acima de 200.
        </p>
        <p className="text-sm tabular-nums">
          {offers.length} {offers.length === 1 ? "oferta" : "ofertas"} neste filtro · {ads} anúncios na
          última leitura · {altas} {altas === 1 ? "nota 4 ou 5" : "notas 4 ou 5"}
        </p>
        {examples ? (
          <p className="text-sm text-gold">
            As ofertas marcadas como exemplo vieram do seed. Não são anúncios reais.
          </p>
        ) : null}
      </header>
      <OfferFilters niches={niches} languages={languages} />
      {offers.length === 0 ? (
        <div className="rounded-md border border-line bg-panel px-4 py-8">
          <h2 className="font-subtitle text-2xl text-gold">Nenhuma oferta com esses filtros.</h2>
          <p className="mt-2 text-sm text-muted">Limpe a busca ou escolha outro nicho.</p>
        </div>
      ) : (
        <OfferList offers={offers} />
      )}
    </div>
  );
}

function unique(values: string[]) {
  return [...new Set(values)];
}
