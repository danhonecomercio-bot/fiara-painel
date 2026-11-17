import Link from "next/link";
import { AdsReadout } from "@/components/ads-readout";
import { OportunidadeMark, OpportunityBadge } from "@/components/opportunity-badge";
import { formatUpdated, heatLabel, heatPrefix } from "@/lib/offers/format";
import type { OfferCard } from "@/lib/offers/types";

export function OfferList({ offers }: { offers: OfferCard[] }) {
  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {offers.map((offer) => (
          <li key={offer.id}>
            <OfferCardView offer={offer} />
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-md border border-line md:block">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead className="bg-panel text-left text-xs uppercase tracking-wide text-gold">
            <tr>
              <th className="px-3 py-2 font-semibold">Oferta</th>
              <th className="px-3 py-2 font-semibold">Anúncios</th>
              <th className="px-3 py-2 font-semibold">Nicho</th>
              <th className="px-3 py-2 font-semibold">Idioma/país</th>
              <th className="px-3 py-2 font-semibold">Funil</th>
              <th className="px-3 py-2 font-semibold">Oportunidade</th>
              <th className="px-3 py-2 font-semibold">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className="border-t border-line align-top hover:bg-panel/70">
                <td className="px-3 py-2.5">
                  <OfferTitle offer={offer} />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <AdsReadout
                    total={offer.total_active_ads}
                    previousTotal={offer.prev_total_active_ads}
                    previousCapturedAt={offer.prev_captured_at}
                  />
                </td>
                <td className="px-3 py-2.5">{offer.niche ?? "—"}</td>
                <td className="px-3 py-2.5">{offer.language_country ?? "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{offer.funnel_model ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex flex-wrap items-center gap-1">
                    <OportunidadeMark score={offer.opportunity_score} />
                    <OpportunityBadge score={offer.opportunity_score} />
                  </span>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap text-muted">
                  {offer.last_captured_at ? formatUpdated(offer.last_captured_at) : "sem leitura"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OfferCardView({ offer }: { offer: OfferCard }) {
  return (
    <Link
      href={`/ofertas/${encodeURIComponent(offer.slug)}`}
      className="grid gap-2 rounded-md border border-line bg-panel p-3 hover:border-gold/50"
    >
      <div className="flex items-start justify-between gap-3">
        <OfferTitle offer={offer} linked={false} />
        <span className="inline-flex flex-wrap items-center justify-end gap-1">
          <OportunidadeMark score={offer.opportunity_score} />
          <OpportunityBadge score={offer.opportunity_score} />
        </span>
      </div>
      <AdsReadout
        total={offer.total_active_ads}
        previousTotal={offer.prev_total_active_ads}
        previousCapturedAt={offer.prev_captured_at}
      />
      <ul className="grid gap-0.5 text-sm text-muted">
        <li>{offer.niche ?? "Nicho não informado"}</li>
        <li>{offer.language_country ?? "Idioma não informado"}</li>
        <li>{offer.funnel_model ?? "Funil não informado"}</li>
      </ul>
      <p className="text-sm text-muted">
        {offer.last_captured_at ? formatUpdated(offer.last_captured_at) : "sem leitura"}
      </p>
    </Link>
  );
}

function OfferTitle({ offer, linked = true }: { offer: OfferCard; linked?: boolean }) {
  const prefix = heatPrefix(offer.total_active_ads);
  const label = heatLabel(offer.total_active_ads);
  const title = (
    <span className="font-display text-lg leading-6 text-gold">
      {label ? <span className="sr-only">{label} </span> : null}
      {prefix ? <span aria-hidden="true">{prefix} </span> : null}
      {offer.title}
    </span>
  );

  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        {linked ? (
          <Link href={`/ofertas/${encodeURIComponent(offer.slug)}`} className="hover:underline">
            {title}
          </Link>
        ) : (
          title
        )}
        {offer.is_example ? (
          <span className="rounded border border-gold/60 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold">
            exemplo
          </span>
        ) : null}
        {offer.status === "paused" ? (
          <span className="rounded border border-white/30 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Pausada
          </span>
        ) : null}
        {offer.expert ? <span className="text-xs text-muted">Expert</span> : null}
      </div>
    </div>
  );
}
