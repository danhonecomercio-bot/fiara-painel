import Link from "next/link";
import { AdsReadout } from "@/components/ads-readout";
import { OportunidadeMark, OpportunityBadge } from "@/components/opportunity-badge";
import { formatFunnel, formatListUpdated, formatTicketCompact } from "@/lib/offers/format";
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
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="bg-panel text-left text-xs uppercase tracking-wide text-gold">
            <tr>
              <th className="px-3 py-2 font-semibold">Oferta</th>
              <th className="px-3 py-2 font-semibold">Anúncios</th>
              <th className="px-3 py-2 font-semibold">Nicho</th>
              <th className="px-3 py-2 font-semibold">Idioma/país</th>
              <th className="px-3 py-2 font-semibold">Funil</th>
              <th className="w-px px-2 py-2 font-semibold">TM</th>
              <th className="px-3 py-2 font-semibold">Oportunidade</th>
              <th className="w-px px-2 py-2 font-semibold">Atualizado</th>
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
                <td className="px-3 py-2.5 whitespace-nowrap">{formatFunnel(offer.funnel_model) ?? "—"}</td>
                <td className="w-px px-2 py-2.5">
                  <TicketCell value={offer.front_ticket} />
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex flex-wrap items-center gap-1">
                    <OportunidadeMark available={offer.modeling_opportunity} />
                    <OpportunityBadge score={offer.opportunity_score} />
                  </span>
                </td>
                <td className="w-px whitespace-nowrap px-2 py-2.5 text-muted tabular-nums">
                  {offer.last_captured_at ? formatListUpdated(offer.last_captured_at) : "—"}
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
          <OportunidadeMark available={offer.modeling_opportunity} />
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
        <li>{formatFunnel(offer.funnel_model) ?? "Funil não informado"}</li>
        <li>
          TM <TicketCell value={offer.front_ticket} />
        </li>
      </ul>
      <p className="text-sm text-muted tabular-nums">
        {offer.last_captured_at ? formatListUpdated(offer.last_captured_at) : "—"}
      </p>
    </Link>
  );
}

function TicketCell({ value }: { value: string | null }) {
  const compact = formatTicketCompact(value);
  if (!compact) return <span className="text-muted">—</span>;
  return (
    <span title={value ?? undefined} className="whitespace-nowrap tabular-nums">
      {compact}
    </span>
  );
}

function OfferTitle({ offer, linked = true }: { offer: OfferCard; linked?: boolean }) {
  const title = (
    <span className="font-display text-lg leading-6 text-gold">{offer.title}</span>
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
