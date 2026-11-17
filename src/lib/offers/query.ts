import type { OfferCard } from "./types";

export const SCORE_FILTERS = [
  "5",
  "4.5",
  "4",
  "3.5",
  "3",
  "2.5",
  "2",
  "1.5",
  "1",
  "0.5",
  "0",
  "nao_avaliada",
] as const;

export type ScoreFilter = (typeof SCORE_FILTERS)[number];

export function scoreFilterLabel(value: ScoreFilter) {
  if (value === "nao_avaliada") return "Não avaliada";
  return value.replace(".", ",");
}

export type OfferFilters = {
  q: string;
  nicho: string[];
  idioma: string[];
  oportunidade: ScoreFilter[];
  soOportunidades: boolean;
  ordem: "anuncios" | "crescimento" | "recentes";
};

export function isOpportunityScore(score: number | null | undefined) {
  return score != null && score >= 4.5;
}

export function parseFilters(params: {
  q?: string | string[];
  nicho?: string | string[];
  idioma?: string | string[];
  oportunidade?: string | string[];
  so_oportunidades?: string | string[];
  ordem?: string | string[];
}): OfferFilters {
  const ordem = first(params.ordem);
  return {
    q: first(params.q) ?? "",
    nicho: many(params.nicho),
    idioma: many(params.idioma),
    oportunidade: many(params.oportunidade)
      .map((value) => value.replace(",", "."))
      .filter(isScoreFilter),
    soOportunidades: first(params.so_oportunidades) === "1",
    ordem:
      ordem === "crescimento" || ordem === "recentes" || ordem === "anuncios"
        ? ordem
        : "anuncios",
  };
}

export function filterAndSort(cards: OfferCard[], filters: OfferFilters) {
  const query = fold(filters.q.trim());
  const filtered = cards.filter((card) => {
    if (filters.nicho.length > 0 && !filters.nicho.includes(card.niche ?? "")) return false;
    if (filters.idioma.length > 0 && !filters.idioma.includes(card.language_country ?? "")) {
      return false;
    }
    if (filters.oportunidade.length > 0 && !matchesScore(card.opportunity_score, filters.oportunidade)) {
      return false;
    }
    if (filters.soOportunidades && !isOpportunityScore(card.opportunity_score)) return false;
    if (!query) return true;
    const haystack = [
      card.title,
      card.slug,
      card.promise,
      card.niche,
      card.language_country,
      card.front_ticket,
      card.funnel_model,
      ...card.library_names,
    ]
      .filter(Boolean)
      .join(" ");
    return fold(haystack).includes(query);
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => compareCards(a, b, filters.ordem));
  return sorted;
}

function compareCards(a: OfferCard, b: OfferCard, ordem: OfferFilters["ordem"]) {
  if (ordem === "crescimento") {
    const delta = growth(b) - growth(a);
    if (delta !== 0) return delta;
  } else if (ordem === "recentes") {
    const time = timestamp(b.last_captured_at) - timestamp(a.last_captured_at);
    if (time !== 0) return time;
  } else {
    const ads = (b.total_active_ads ?? -1) - (a.total_active_ads ?? -1);
    if (ads !== 0) return ads;
  }
  return a.title.localeCompare(b.title, "pt-BR");
}

function growth(card: OfferCard) {
  if (card.total_active_ads == null || card.prev_total_active_ads == null) return Number.NEGATIVE_INFINITY;
  return card.total_active_ads - card.prev_total_active_ads;
}

function timestamp(value: string | null) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function many(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function isScoreFilter(value: string): value is ScoreFilter {
  return (SCORE_FILTERS as readonly string[]).includes(value);
}

function matchesScore(score: number | null, selected: ScoreFilter[]) {
  if (score == null) return selected.includes("nao_avaliada");
  const token = Number.isInteger(score) ? String(score) : score.toFixed(1);
  return selected.includes(token as ScoreFilter);
}
