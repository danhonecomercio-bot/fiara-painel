import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MemoryOfferRepository } from "../data/memory-repository";
import { seedExampleOffers } from "../offers/examples";
import { adsReadout, formatUpdated, heatPrefix } from "../offers/format";
import { offerPatchSchema } from "../offers/schema";
import { deleteOfferBySlug, getOffers, patchOfferBySlug, postOffers } from "./handlers";

const KEY = "test-bot-key";

function request(url: string, init: RequestInit = {}) {
  return new Request(url, init);
}

function authorized(body: unknown, method = "POST") {
  return request("https://painel.fiara.com.br/api/offers", {
    method,
    headers: {
      authorization: `Bearer ${KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("language_scan", () => {
  it("tira o rastreio das URLs da varredura", () => {
    const parsed = offerPatchSchema.parse({
      language_scan: {
        ran_at: "2026-11-17T10:00:00.000Z",
        results: {
          es: [
            {
              library_url: "https://www.facebook.com/ads/library/?id=1&utm_source=meta&fbclid=abc",
              name: "Oferta ES",
              page_url: "https://oferta.exemplo/es?src=meta",
              checkout_url: "https://pay.oferta.exemplo/es?gclid=1",
              front_ticket: "€ 27",
            },
          ],
          en: [],
        },
      },
    });
    assert.equal(
      parsed.language_scan?.results.es?.[0]?.library_url,
      "https://www.facebook.com/ads/library/?id=1",
    );
    assert.equal(parsed.language_scan?.results.es?.[0]?.page_url, "https://oferta.exemplo/es");
    assert.equal(parsed.language_scan?.results.es?.[0]?.checkout_url, "https://pay.oferta.exemplo/es");
    assert.deepEqual(parsed.language_scan?.results.en, []);
    assert.equal(parsed.language_scan?.results.pt, undefined);
  });
});

describe("API dos bots", () => {
  it("recusa chamada sem a chave e não grava", async () => {
    const repo = new MemoryOfferRepository();
    const response = await postOffers(
      request("https://painel.fiara.com.br/api/offers", {
        method: "POST",
        body: JSON.stringify({ slug: "x", title: "X", libraries: [] }),
      }),
      repo,
      KEY,
    );
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.error, "nao_autorizado");
    assert.equal(repo.listCards().length, 0);
  });

  it("recusa chave errada e JSON inválido", async () => {
    const repo = new MemoryOfferRepository();
    const wrong = await postOffers(
      request("https://painel.fiara.com.br/api/offers", {
        method: "POST",
        headers: { authorization: "Bearer outra" },
        body: "{}",
      }),
      repo,
      KEY,
    );
    assert.equal(wrong.status, 401);

    const broken = await postOffers(
      request("https://painel.fiara.com.br/api/offers", {
        method: "POST",
        headers: { authorization: `Bearer ${KEY}` },
        body: "{",
      }),
      repo,
      KEY,
    );
    assert.equal(broken.status, 400);
    assert.equal((await broken.json()).error, "json_invalido");
  });

  it("faz upsert por slug, soma os anúncios e acrescenta snapshot", async () => {
    const repo = new MemoryOfferRepository();
    const created = await postOffers(
      authorized({
        slug: "oferta-teste",
        title: "Oferta teste",
        promise: "Promessa original",
        libraries: [
          {
            page_name: "Página A",
            library_url: "https://www.facebook.com/ads/library/?id=1",
            active_ads: 30,
          },
          {
            page_name: "Página B",
            library_url: "https://www.facebook.com/ads/library/?id=2",
            active_ads: 12,
          },
        ],
      }),
      repo,
      KEY,
    );
    assert.equal(created.status, 200);
    const createdBody = await created.json();
    assert.equal(createdBody.results[0].created, true);
    assert.equal(createdBody.results[0].total_active_ads, 42);

    const updated = await postOffers(
      authorized({
        offers: [
          {
            slug: "oferta-teste",
            title: "Oferta teste revisada",
            libraries: [
              {
                page_name: "Página A",
                library_url: "https://www.facebook.com/ads/library/?id=1",
                active_ads: 50,
              },
            ],
          },
        ],
      }),
      repo,
      KEY,
    );
    assert.equal(updated.status, 200);
    const updatedBody = await updated.json();
    assert.equal(updatedBody.results[0].created, false);
    assert.equal(updatedBody.results[0].total_active_ads, 50);

    const detail = repo.getDetail("oferta-teste");
    assert.equal(detail?.title, "Oferta teste revisada");
    assert.equal(detail?.promise, "Promessa original");
    assert.equal(detail?.libraries.length, 1);
    assert.equal(detail?.snapshots.length, 2);
  });

  it("não grava payload inválido e o patch não cria snapshot", async () => {
    const repo = new MemoryOfferRepository();
    const invalid = await postOffers(
      authorized({
        slug: "ruim",
        title: "Ruim",
        opportunity: "altissima",
        libraries: [],
      }),
      repo,
      KEY,
    );
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error, "payload_invalido");
    assert.equal(repo.listCards().length, 0);

    await postOffers(
      authorized({
        slug: "boa",
        title: "Boa",
        destination_urls: ["https://oferta.exemplo/quiz?utm_source=meta&fbclid=abc&id=9"],
        libraries: [
          {
            page_name: "Página",
            library_url: "https://www.facebook.com/ads/library/?id=9&utm_source=meta&fbclid=abc",
            active_ads: 1,
          },
        ],
      }),
      repo,
      KEY,
    );
    const before = repo.getDetail("boa")?.snapshots.length;

    assert.equal(
      repo.getDetail("boa")?.destination_urls[0],
      "https://oferta.exemplo/quiz?id=9",
    );
    assert.equal(
      repo.getDetail("boa")?.libraries[0]?.library_url,
      "https://www.facebook.com/ads/library/?id=9",
    );

    const patched = await patchOfferBySlug(
      authorized(
        { opportunity_score: 4, opportunity_notes: "Escala consistente." },
        "PATCH",
      ),
      "boa",
      repo,
      KEY,
    );
    assert.equal(patched.status, 200);
    const body = await patched.json();
    assert.equal(body.offer.opportunity_score, 4);
    assert.equal(body.offer.opportunity_notes, "Escala consistente.");
    assert.equal(repo.getDetail("boa")?.snapshots.length, before);

    const niche = await patchOfferBySlug(
      authorized({ niche: "Emagrecimento" }, "PATCH"),
      "boa",
      repo,
      KEY,
    );
    assert.equal(niche.status, 200);
    assert.equal((await niche.json()).offer.niche, "Emagrecimento");

    const removed = await deleteOfferBySlug(
      authorized(undefined, "DELETE"),
      "boa",
      repo,
      KEY,
    );
    assert.equal(removed.status, 200);
    assert.equal(repo.getDetail("boa"), null);
    const missingDelete = await deleteOfferBySlug(
      authorized(undefined, "DELETE"),
      "boa",
      repo,
      KEY,
    );
    assert.equal(missingDelete.status, 404);

    const missing = await patchOfferBySlug(
      authorized({ opportunity: "baixa" }, "PATCH"),
      "nao-existe",
      repo,
      KEY,
    );
    assert.equal(missing.status, 404);
  });

  it("lista por since e devolve as ofertas de exemplo no formato do painel", async () => {
    const repo = new MemoryOfferRepository();
    await seedExampleOffers(repo);

    const listed = await getOffers(
      request("https://painel.fiara.com.br/api/offers?since=2000-01-01T00:00:00.000Z", {
        headers: { authorization: `Bearer ${KEY}` },
      }),
      repo,
      KEY,
    );
    assert.equal(listed.status, 200);
    const payload = await listed.json();
    assert.equal(payload.count, 3);
    assert.equal(payload.offers[0].libraries.length > 0, true);

    const future = await getOffers(
      request("https://painel.fiara.com.br/api/offers?since=2999-01-01T00:00:00.000Z", {
        headers: { authorization: `Bearer ${KEY}` },
      }),
      repo,
      KEY,
    );
    assert.equal((await future.json()).count, 0);

    const cards = repo.listCards();
    const queima = cards.find((card) => card.slug === "exemplo-protocolo-queima-21");
    const reserva = cards.find((card) => card.slug === "exemplo-reserva-blindada");
    const reconquista = cards.find((card) => card.slug === "exemplo-reconquista-14-dias");
    assert.ok(queima && reserva && reconquista);
    assert.equal(
      adsReadout(queima.total_active_ads, queima.prev_total_active_ads, queima.prev_captured_at).text,
      "546 (+80 desde 15/11 22h)",
    );
    assert.equal(heatPrefix(queima.total_active_ads), "⭐");
    assert.equal(formatUpdated(queima.last_captured_at ?? ""), "atualizado em 16/11 - 7h");
    assert.equal(
      adsReadout(reserva.total_active_ads, reserva.prev_total_active_ads, reserva.prev_captured_at).text,
      "248 (+110 desde 15/11 22h)",
    );
    assert.equal(heatPrefix(reserva.total_active_ads), "🔥");
    assert.equal(
      adsReadout(
        reconquista.total_active_ads,
        reconquista.prev_total_active_ads,
        reconquista.prev_captured_at,
      ).text,
      "86 (-15 desde 15/11 7h)",
    );
    assert.equal(formatUpdated(reconquista.last_captured_at ?? ""), "atualizado em 15/11 - 22h");
    assert.equal(queima.is_example, true);
  });
});
