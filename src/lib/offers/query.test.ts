import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterAndSort, isOpportunityScore, parseFilters } from "./query";
import type { OfferCard } from "./types";

function card(partial: Partial<OfferCard> & Pick<OfferCard, "slug" | "title">): OfferCard {
  return {
    id: partial.slug,
    niche: null,
    language_country: null,
    opportunity: "nao_avaliada",
    opportunity_score: null,
    expert: false,
    promise: null,
    front_ticket: null,
    funnel_model: null,
    status: "active",
    running_since: null,
    updated_at: "2026-11-16T10:00:00.000Z",
    created_at: "2026-11-01T00:00:00.000Z",
    is_example: false,
    total_active_ads: 0,
    last_captured_at: "2026-11-16T10:00:00.000Z",
    prev_total_active_ads: 0,
    prev_captured_at: "2026-11-16T01:00:00.000Z",
    library_names: [],
    ...partial,
  };
}

const cards = [
  card({
    slug: "a",
    title: "Queima",
    niche: "Emagrecimento",
    language_country: "Português / Brasil",
    opportunity: "alta",
    opportunity_score: 5,
    total_active_ads: 546,
    prev_total_active_ads: 466,
    promise: "Perca peso",
    library_names: ["Dra. Helena"],
  }),
  card({
    slug: "b",
    title: "Reserva",
    niche: "Finanças",
    language_country: "Português / Brasil",
    opportunity: "media",
    opportunity_score: 3,
    total_active_ads: 248,
    prev_total_active_ads: 138,
  }),
  card({
    slug: "c",
    title: "Reconquista",
    niche: "Relacionamento",
    language_country: "Espanhol / México",
    opportunity: "nao_avaliada",
    total_active_ads: 86,
    prev_total_active_ads: 101,
    last_captured_at: "2026-11-16T01:00:00.000Z",
  }),
];

describe("filtros", () => {
  it("aceita oportunidade em multi-seleção e busca sem acento", () => {
    const filters = parseFilters({
      oportunidade: ["5", "3"],
      q: "perca",
    });
    const result = filterAndSort(cards, filters);
    assert.deepEqual(
      result.map((item) => item.slug),
      ["a"],
    );
  });

  it("ordena por anúncios, crescimento e data", () => {
    assert.deepEqual(
      filterAndSort(cards, parseFilters({})).map((item) => item.slug),
      ["a", "b", "c"],
    );
    assert.deepEqual(
      filterAndSort(cards, parseFilters({ ordem: "crescimento" })).map((item) => item.slug),
      ["b", "a", "c"],
    );
    assert.deepEqual(
      filterAndSort(cards, parseFilters({ ordem: "recentes" })).map((item) => item.slug),
      ["a", "b", "c"],
    );
  });

  it("aceita nota 4,5 no filtro e na oportunidade", () => {
    const filters = parseFilters({ oportunidade: "4,5" });
    assert.deepEqual(filters.oportunidade, ["4.5"]);
    const result = filterAndSort(
      [card({ slug: "meio", title: "Meio", opportunity_score: 4.5 })],
      filters,
    );
    assert.deepEqual(
      result.map((item) => item.slug),
      ["meio"],
    );
    assert.equal(isOpportunityScore(4.5), true);
    assert.equal(isOpportunityScore(4), false);
  });

  it("mostra só oportunidades com nota 4,5 ou mais", () => {
    const result = filterAndSort(cards, parseFilters({ so_oportunidades: "1" }));
    assert.deepEqual(
      result.map((item) => item.slug),
      ["a"],
    );
  });

  it("filtra nicho e idioma juntos", () => {
    const result = filterAndSort(
      cards,
      parseFilters({ nicho: ["Relacionamento"], idioma: "Espanhol / México" }),
    );
    assert.deepEqual(
      result.map((item) => item.slug),
      ["c"],
    );
  });
});
