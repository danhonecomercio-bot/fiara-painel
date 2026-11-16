import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OfferDetail } from "../offers/types";
import { createMemoryActionStore } from "./memory-store";
import { requestOfferAction } from "./request";
import { postWebhook, webhookBody } from "./webhook";

function offer(): OfferDetail {
  return {
    id: "offer-1",
    slug: "Protocolo-Queima-21",
    title: "Protocolo Queima 21",
    niche: null,
    language_country: null,
    opportunity: "nao_avaliada",
    opportunity_score: null,
    opportunity_notes: null,
    google_library_url: null,
    expert: false,
    promise: null,
    front_ticket: null,
    funnel_model: null,
    running_since: null,
    destination_urls: [],
    checkout_url: null,
    order_bumps: [],
    upsells: [],
    modeling_notes: null,
    raw: null,
    status: "active",
    created_at: "2026-11-16T10:00:00.000Z",
    updated_at: "2026-11-16T10:00:00.000Z",
    libraries: [
      {
        page_name: "Página",
        library_url: "https://www.facebook.com/ads/library/?id=1&utm_source=meta&fbclid=abc",
        active_ads: 10,
      },
    ],
    snapshots: [],
  };
}

describe("webhook de ações", () => {
  it("monta o corpo com o slug do funil e sem rastreio", () => {
    const body = webhookBody({
      action: "baixar_top_ads",
      offer: offer(),
      requestedBy: "membro@fiara.com.br",
      requestedAt: "2026-11-16T18:00:00.000Z",
    });
    assert.deepEqual(body, {
      action: "baixar_top_ads",
      slug: "Protocolo-Queima-21",
      title: "Protocolo Queima 21",
      funnel_slug: "protocolo-queima-21",
      meta_library_urls: ["https://www.facebook.com/ads/library/?id=1"],
      requested_by: "membro@fiara.com.br",
      requested_at: "2026-11-16T18:00:00.000Z",
    });
  });

  it("grava sent quando o webhook aceita, e failed numa única tentativa", async () => {
    const store = createMemoryActionStore();
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const sent = await requestOfferAction({
      offer: offer(),
      action: "baixar_top_ads",
      requestedBy: "membro@fiara.com.br",
      store,
      config: { url: "https://bot.exemplo/hook", key: "segredo" },
      now: new Date("2026-11-16T18:00:00.000Z"),
      post: async (config, body) => {
        calls.push({
          url: config.url,
          init: {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${config.key}`,
              "x-automation-key": config.key,
            },
            body: JSON.stringify(body),
          },
        });
      },
    });
    assert.equal(sent.status, "sent");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.init.headers && (calls[0].init.headers as Record<string, string>).authorization, "Bearer segredo");

    const failed = await requestOfferAction({
      offer: offer(),
      action: "modelar",
      requestedBy: "membro@fiara.com.br",
      store,
      config: { url: "https://bot.exemplo/hook", key: "segredo" },
      post: async () => {
        throw new Error("Webhook respondeu 500.");
      },
    });
    assert.equal(failed.status, "failed");
    assert.equal(failed.error, "Webhook respondeu 500.");
    assert.equal((await store.latestForOffer("offer-1")).length, 2);
  });

  it("envia os dois headers e não repete a chamada", async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async (_url, init) => {
      calls += 1;
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("authorization"), "Bearer segredo");
      assert.equal(headers.get("x-automation-key"), "segredo");
      assert.equal(headers.get("content-type"), "application/json");
      return new Response("não", { status: 502 });
    };
    try {
      await assert.rejects(
        () =>
          postWebhook(
            { url: "https://bot.exemplo/hook", key: "segredo" },
            webhookBody({
              action: "baixar_top_ads",
              offer: offer(),
              requestedBy: "membro@fiara.com.br",
              requestedAt: "2026-11-16T18:00:00.000Z",
            }),
          ),
        /502/,
      );
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = original;
    }
  });
});
