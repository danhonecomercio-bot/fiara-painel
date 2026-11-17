import Link from "next/link";
import type { ReactNode } from "react";
import { AdsChart } from "@/components/ads-chart";
import { AdsReadout } from "@/components/ads-readout";
import { OfferActions } from "@/components/offer-actions";
import { OportunidadeMark, OpportunityBadge } from "@/components/opportunity-badge";
import type { OfferAction } from "@/lib/actions/types";
import { formatBumpPrice, formatCalendarDate, formatFunnel, formatListUpdated, formatScanStamp, formatScore, formatUpdated, stripTracking } from "@/lib/offers/format";
import { isModelingOpportunity } from "@/lib/offers/query";
import { SCAN_LANGUAGES } from "@/lib/offers/schema";
import type { OfferDetail } from "@/lib/offers/types";

export function OfferDetailView({
  offer,
  actions,
  topadsReady,
  modelarReady,
  varreduraReady,
}: {
  offer: OfferDetail;
  actions: OfferAction[];
  topadsReady: boolean;
  modelarReady: boolean;
  varreduraReady: boolean;
}) {
  const latest = offer.snapshots[0] ?? null;
  const previous = offer.snapshots[1] ?? null;

  return (
    <article className="grid gap-6">
      <div className="grid gap-3">
        <Link href="/" className="text-sm font-semibold text-gold hover:underline">
          Voltar às ofertas
        </Link>
        <h1 className="font-display text-3xl leading-tight text-gold sm:text-4xl">{offer.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {offer.raw?.example === true ? (
            <span className="rounded border border-gold/60 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold">
              exemplo
            </span>
          ) : null}
          <OportunidadeMark available={isModelingOpportunity(offer.modeling_check)} />
          <OpportunityBadge score={offer.opportunity_score} />
          {offer.status === "paused" ? (
            <span className="rounded border border-white/30 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Pausada
            </span>
          ) : (
            <span className="text-xs text-muted">Ativa</span>
          )}
        </div>
        <ScoreBreakdown breakdown={offer.score_breakdown} total={offer.opportunity_score} />
        <ModelingCheckSection check={offer.modeling_check} />
        <LibraryLinks offer={offer} />
        <OfferActions
          slug={offer.slug}
          initial={actions}
          topadsReady={topadsReady}
          modelarReady={modelarReady}
          varreduraReady={varreduraReady}
        />
        <p className="text-sm text-muted">
          {latest ? formatUpdated(latest.captured_at) : "sem leitura"} · slug {offer.slug}
        </p>
        <p className="text-lg">
          <AdsReadout
            total={latest?.total_active_ads ?? null}
            previousTotal={previous?.total_active_ads ?? null}
            previousCapturedAt={previous?.captured_at ?? null}
          />
        </p>
      </div>

      {offer.raw?.example === true ? (
        <p className="rounded-md border border-gold/40 bg-panel px-3 py-2 text-sm">
          Dado de exemplo. Esta oferta não foi minerada da Biblioteca de Anúncios.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <dl>
          <Field label="Nicho">{text(offer.niche)}</Field>
          <Field label="Idioma/país">{text(offer.language_country)}</Field>
          <Field label="Oportunidade">{isModelingOpportunity(offer.modeling_check) ? "Sim" : "Não"}</Field>
          <Field label="Notas de oportunidade">{text(offer.opportunity_notes)}</Field>
          <Field label="Expert">{offer.expert ? "Sim" : "Não"}</Field>
          <Field label="Promessa">{text(offer.promise)}</Field>
          <Field label="TM do Front">{text(offer.front_ticket)}</Field>
          <Field label="Funil">{text(formatFunnel(offer.funnel_model))}</Field>
          <Field label="No ar desde">
            {offer.running_since ? formatCalendarDate(offer.running_since) : "—"}
          </Field>
          <Field label="Status">{offer.status === "paused" ? "Pausada" : "Ativa"}</Field>
        </dl>
        <dl>
          <Field label="URLs de destino">
            <LineList
              items={offer.destination_urls}
              empty="Nenhuma URL de destino."
              render={(url) => <ExternalLink href={url} />}
            />
          </Field>
          <Field label="Checkout">
            {offer.checkout_url ? <ExternalLink href={offer.checkout_url} /> : "—"}
          </Field>
          <Field label="Order bumps">
            {offer.order_bumps.length === 0 ? (
              <p>Nenhum order bump.</p>
            ) : (
              <ul className="grid gap-3">
                {offer.order_bumps.map((bump, index) => (
                  <li key={`${bump.title}-${index}`} className="grid gap-0.5">
                    <span className="font-semibold">{bump.title}</span>
                    {bump.description ? <span>{bump.description}</span> : null}
                    {formatBumpPrice(bump.price_cash, bump.price_installments) ? (
                      <span>{formatBumpPrice(bump.price_cash, bump.price_installments)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="Upsells e downsells">
            {offer.upsells.length === 0 ? (
              <p>Nenhum upsell.</p>
            ) : (
              <ul className="grid gap-3">
                {offer.upsells.map((upsell, index) => (
                  <li key={`${upsell.title}-${index}`} className="grid gap-0.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gold">
                      {upsell.kind === "downsell" ? "Downsell" : "Upsell"}
                    </span>
                    <span className="font-semibold">{upsell.title}</span>
                    {upsell.url ? <ExternalLink href={upsell.url} /> : null}
                    {upsell.price ? <span>{upsell.price}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </Field>
        </dl>
      </div>

      <section className="grid gap-3">
        <h2 className="font-subtitle text-2xl text-gold">Histórico de anúncios ativos</h2>
        <AdsChart snapshots={offer.snapshots} />
      </section>

      <section className="grid gap-3">
        <h2 className="font-subtitle text-2xl text-gold">Notas de modelagem</h2>
        <p className="whitespace-pre-wrap text-sm leading-6">{offer.modeling_notes || "—"}</p>
      </section>

      <section>
        <details className="rounded-md border border-line bg-panel px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-gold">Dados brutos</summary>
          <pre className="mt-3 overflow-x-auto text-xs leading-5 text-muted">
            {JSON.stringify(offer.raw ?? {}, null, 2)}
          </pre>
        </details>
      </section>

      <LanguageScanSection offer={offer} />
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3">
      <dt className="font-subtitle text-xs uppercase tracking-wide text-gold">{label}</dt>
      <dd className="text-sm leading-6 text-white">{children}</dd>
    </div>
  );
}

function LineList<T extends string>({
  items,
  empty,
  render,
}: {
  items: T[];
  empty: string;
  render: (item: T) => ReactNode;
}) {
  if (items.length === 0) return <p>{empty}</p>;
  return (
    <ul className="grid gap-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{render(item)}</li>
      ))}
    </ul>
  );
}

const SCAN_TITLE = {
  es: "Espanhol ofertas encontradas",
  en: "Inglês ofertas encontradas",
  fr: "Francês ofertas encontradas",
  de: "Alemão ofertas encontradas",
  it: "Italiano ofertas encontradas",
  pt: "Português ofertas encontradas",
} as const;

function ScoreBreakdown({
  breakdown,
  total,
}: {
  breakdown: OfferDetail["score_breakdown"];
  total: number | null;
}) {
  if (!breakdown || breakdown.length === 0) return null;
  return (
    <table className="w-full max-w-xl border-collapse text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-gold">
        <tr>
          <th className="py-1 pr-3 font-semibold">Critério</th>
          <th className="py-1 pr-3 font-semibold">Detalhe</th>
          <th className="py-1 font-semibold">Pontos</th>
        </tr>
      </thead>
      <tbody>
        {breakdown.map((item, index) => (
          <tr key={`${item.criterion}-${index}`} className="border-t border-line">
            <td className="py-1 pr-3">{item.criterion}</td>
            <td className="py-1 pr-3 text-muted">{item.detail || "—"}</td>
            <td className="py-1 tabular-nums">{formatScore(item.points)}</td>
          </tr>
        ))}
        <tr className="border-t border-line font-semibold">
          <td className="py-1 pr-3" colSpan={2}>
            Total
          </td>
          <td className="py-1 tabular-nums">{total == null ? "—" : formatScore(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function ModelingCheckSection({ check }: { check: OfferDetail["modeling_check"] }) {
  if (!check) return null;
  const techniques = [...check.techniques].sort((a, b) => a.rank - b.rank);
  const available = techniques.filter((item) => item.available);
  const unavailable = techniques.filter((item) => !item.available);
  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <h2 className="font-subtitle text-2xl text-gold">Verificação de modelagem</h2>
        <p className="text-sm text-muted">{formatListUpdated(check.checked_at)}</p>
      </div>
      {check.summary ? <p className="text-sm leading-6">{check.summary}</p> : null}
      <ul className="grid gap-2">
        {available.map((item) => (
          <li key={item.key} className="grid gap-1 rounded-md border border-gold bg-panel px-3 py-2 text-sm">
            <span className="font-semibold text-gold">{item.name}</span>
            {item.why ? <span>{item.why}</span> : null}
            {item.suggestion ? <span className="text-muted">{item.suggestion}</span> : null}
          </li>
        ))}
      </ul>
      {unavailable.length > 0 ? (
        <details className="rounded-md border border-line px-3 py-2 text-sm text-muted">
          <summary className="cursor-pointer font-semibold">Indisponíveis ({unavailable.length})</summary>
          <ul className="mt-2 grid gap-2">
            {unavailable.map((item) => (
              <li key={item.key}>
                <span className="text-white">{item.name}.</span> {item.why}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function LanguageScanSection({ offer }: { offer: OfferDetail }) {
  const scan = offer.language_scan;
  if (!scan) return null;
  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="font-subtitle text-2xl text-gold">Varredura em idiomas</h2>
        <p className="text-sm text-muted">{formatScanStamp(scan.ran_at)}</p>
      </div>
      {SCAN_LANGUAGES.filter((lang) => lang in scan.results).map((lang) => {
        const items = scan.results[lang] ?? [];
        return (
          <div key={lang} className="grid gap-2">
            <h3 className="font-subtitle text-lg text-gold">{SCAN_TITLE[lang]}</h3>
            {items.length === 0 ? (
              <p className="text-sm">Nenhuma encontrada</p>
            ) : (
              <ul className="grid gap-3">
                {items.map((item, index) => (
                  <li key={`${item.library_url}-${index}`} className="grid gap-1 rounded-md border border-line bg-panel px-3 py-2 text-sm">
                    <span className="font-semibold">{item.name}</span>
                    <span>
                      FB Library <ExternalLink href={item.library_url} />
                    </span>
                    <span className="tabular-nums">{item.active_ads} anúncios ativos</span>
                    <span>TM do Front: {item.front_ticket || "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

function LibraryLinks({ offer }: { offer: OfferDetail }) {
  const libraries = offer.libraries.slice().sort((a, b) => b.active_ads - a.active_ads);
  const google = offer.google_library_url ? stripTracking(offer.google_library_url) : null;
  if (libraries.length === 0 && !google) return null;
  return (
    <section className="grid gap-2">
      <h2 className="font-subtitle text-xs uppercase tracking-wide text-gold">Bibliotecas</h2>
      {libraries.length > 0 ? (
        <ul className="grid gap-2">
          {libraries.map((library, index) => (
            <li
              key={`${library.library_url}-${index}`}
              className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3"
            >
              <span className="font-semibold">{library.page_name}</span>
              <ExternalLink href={library.library_url} />
              <span className="tabular-nums">{library.active_ads} anúncios ativos</span>
            </li>
          ))}
        </ul>
      ) : null}
      {google ? (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3">
          <span className="font-semibold">Biblioteca do Google</span>
          <ExternalLink href={google} />
        </div>
      ) : null}
    </section>
  );
}

function ExternalLink({ href }: { href: string }) {
  const clean = stripTracking(href);
  const url = clean.startsWith("http://") || clean.startsWith("https://") ? clean : `https://${clean}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="break-all text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold"
    >
      {clean}
    </a>
  );
}

function text(value: string | null | undefined) {
  return value ? <span className="whitespace-pre-wrap">{value}</span> : "—";
}
