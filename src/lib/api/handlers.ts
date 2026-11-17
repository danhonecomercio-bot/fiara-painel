import { timingSafeEqual } from "node:crypto";
import { autoSkipMessage, shouldAutoVarredura } from "../actions/auto";
import { requestOfferAction } from "../actions/request";
import { webhookConfig } from "../actions/webhook";
import type { OfferRepository } from "../data/repository";
import {
  normalizePostBody,
  offerPatchSchema,
  postBodySchema,
  zodIssues,
} from "../offers/schema";
import type { OfferDetail } from "../offers/types";

const MAX_BODY = 1_500_000;

export function bearerMatches(header: string | null, expected: string) {
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length);
  const received = Buffer.from(token);
  const wanted = Buffer.from(expected);
  if (received.length !== wanted.length) {
    timingSafeEqual(wanted, wanted);
    return false;
  }
  return timingSafeEqual(received, wanted);
}

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function authorize(request: Request, apiKey: string | undefined) {
  if (!apiKey) {
    return json(
      {
        error: "nao_configurado",
        message: "BOT_API_KEY não está configurada no servidor.",
      },
      500,
    );
  }
  if (!bearerMatches(request.headers.get("authorization"), apiKey)) {
    return json(
      {
        error: "nao_autorizado",
        message: "Envie o header Authorization: Bearer <BOT_API_KEY>.",
      },
      401,
    );
  }
  return null;
}

async function readJson(request: Request) {
  const text = await request.text();
  if (text.length > MAX_BODY) {
    return {
      ok: false as const,
      response: json(
        { error: "payload_grande", message: "O corpo passa de 1,5 MB." },
        413,
      ),
    };
  }
  if (!text.trim()) {
    return {
      ok: false as const,
      response: json({ error: "json_invalido", message: "O corpo está vazio." }, 400),
    };
  }
  try {
    return { ok: true as const, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false as const,
      response: json({ error: "json_invalido", message: "O corpo não é JSON válido." }, 400),
    };
  }
}

export function toOfferJson(offer: OfferDetail) {
  return {
    id: offer.id,
    slug: offer.slug,
    title: offer.title,
    niche: offer.niche,
    language_country: offer.language_country,
    opportunity: offer.opportunity,
    opportunity_score: offer.opportunity_score,
    opportunity_notes: offer.opportunity_notes,
    google_library_url: offer.google_library_url,
    expert: offer.expert,
    promise: offer.promise,
    front_ticket: offer.front_ticket,
    funnel_model: offer.funnel_model,
    running_since: offer.running_since,
    destination_urls: offer.destination_urls,
    checkout_url: offer.checkout_url,
    order_bumps: offer.order_bumps,
    upsells: offer.upsells,
    modeling_notes: offer.modeling_notes,
    language_scan: offer.language_scan,
    raw: offer.raw,
    status: offer.status,
    created_at: offer.created_at,
    updated_at: offer.updated_at,
    libraries: offer.libraries,
    snapshots: offer.snapshots,
  };
}

export async function postOffers(request: Request, repo: OfferRepository, apiKey: string | undefined) {
  const denied = authorize(request, apiKey);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = postBodySchema.safeParse(normalizePostBody(body.value));
  if (!parsed.success) {
    return json(
      {
        error: "payload_invalido",
        message: "O corpo não passou na validação.",
        issues: zodIssues(parsed.error),
      },
      400,
    );
  }

  const seen = new Set<string>();
  for (const offer of parsed.data.offers) {
    if (seen.has(offer.slug)) {
      return json(
        {
          error: "payload_invalido",
          message: "O mesmo slug aparece mais de uma vez neste lote.",
          issues: [{ path: "offers", message: `slug repetido: ${offer.slug}` }],
        },
        400,
      );
    }
    seen.add(offer.slug);
  }

  const results = [];
  for (const offer of parsed.data.offers) {
    try {
      const saved = await repo.upsertMinedOffer(offer);
      results.push(saved);
      if (saved.created) {
        await fireAuto("dissecar", {
          id: saved.id,
          slug: offer.slug,
          title: offer.title,
          libraries: offer.libraries,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gravar a oferta.";
      if (/language_scan/.test(message)) {
        return json(
          {
            error: "nao_configurado",
            message: "A coluna language_scan ainda não existe. Rode a migração nova.",
            failed_slug: offer.slug,
            results,
          },
          503,
        );
      }
      return json(
        {
          error: "falha_parcial",
          message,
          failed_slug: offer.slug,
          results,
        },
        500,
      );
    }
  }

  return json({ ok: true, count: results.length, results });
}

export async function patchOfferBySlug(
  request: Request,
  slug: string,
  repo: OfferRepository,
  apiKey: string | undefined,
) {
  const denied = authorize(request, apiKey);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body.ok) return body.response;

  const parsed = offerPatchSchema.safeParse(body.value);
  if (!parsed.success) {
    return json(
      {
        error: "payload_invalido",
        message: "O corpo não passou na validação.",
        issues: zodIssues(parsed.error),
      },
      400,
    );
  }

  try {
    const updated = await repo.patchOffer(decodeURIComponent(slug), parsed.data);
    if (!updated) {
      return json(
        { error: "nao_encontrada", message: "Não há oferta com esse slug." },
        404,
      );
    }
    await maybeVarredura(updated, parsed.data.opportunity_score);
    return json({ ok: true, offer: toOfferJson(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar a oferta.";
    if (/language_scan/.test(message)) {
      return json(
        {
          error: "nao_configurado",
          message: "A coluna language_scan ainda não existe. Rode a migração nova.",
        },
        503,
      );
    }
    return json({ error: "falha_interna", message }, 500);
  }
}

export async function deleteOfferBySlug(
  request: Request,
  slug: string,
  repo: OfferRepository,
  apiKey: string | undefined,
) {
  const denied = authorize(request, apiKey);
  if (denied) return denied;

  try {
    const deleted = await repo.deleteOffer(decodeURIComponent(slug));
    if (!deleted) {
      return json({ error: "nao_encontrada", message: "Não há oferta com esse slug." }, 404);
    }
    return json({ ok: true, slug: decodeURIComponent(slug) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao apagar a oferta.";
    return json({ error: "falha_interna", message }, 500);
  }
}

export async function getOffers(request: Request, repo: OfferRepository, apiKey: string | undefined) {
  const denied = authorize(request, apiKey);
  if (denied) return denied;

  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  if (since && Number.isNaN(Date.parse(since))) {
    return json(
      {
        error: "payload_invalido",
        message: "since precisa ser uma data ISO 8601.",
        issues: [{ path: "since", message: "Data inválida." }],
      },
      400,
    );
  }

  const limit = readBound(url.searchParams.get("limit"), 200, 1, 500);
  const offset = readBound(url.searchParams.get("offset"), 0, 0, 100_000);
  if (!limit.ok || !offset.ok) {
    return json(
      {
        error: "payload_invalido",
        message: "limit e offset precisam ser inteiros dentro do intervalo permitido.",
        issues: [
          ...(!limit.ok ? [{ path: "limit", message: limit.message }] : []),
          ...(!offset.ok ? [{ path: "offset", message: offset.message }] : []),
        ],
      },
      400,
    );
  }

  try {
    const offers = await repo.listOffers({
      since: since ?? undefined,
      limit: limit.value,
      offset: offset.value,
    });
    return json({
      ok: true,
      count: offers.length,
      limit: limit.value,
      offset: offset.value,
      offers: offers.map(toOfferJson),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao listar ofertas.";
    return json({ error: "falha_interna", message }, 500);
  }
}

async function fireAuto(
  action: "dissecar" | "varredura_idiomas",
  offer: Pick<OfferDetail, "id" | "slug" | "title" | "libraries">,
) {
  const config = webhookConfig(action);
  if (!config) {
    console.info(autoSkipMessage(action, offer.slug));
    return;
  }
  try {
    const { getActionStore } = await import("../actions/store");
    await requestOfferAction({
      offer,
      action,
      requestedBy: "sistema",
      store: getActionStore(),
      config,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "falha";
    console.error(`[fiara] auto ${action} falhou para ${offer.slug}: ${message}`);
  }
}

async function maybeVarredura(offer: OfferDetail, score: number | null | undefined) {
  if (score == null || score < 4.5) return;
  const config = webhookConfig("varredura_idiomas");
  if (!config) {
    console.info(autoSkipMessage("varredura_idiomas", offer.slug));
    return;
  }
  try {
    const { getActionStore } = await import("../actions/store");
    const store = getActionStore();
    const existing = await store.listForOffer(offer.id);
    if (!shouldAutoVarredura(score, existing)) return;
    await requestOfferAction({
      offer,
      action: "varredura_idiomas",
      requestedBy: "sistema",
      store,
      config,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "falha";
    console.error(`[fiara] auto varredura_idiomas falhou para ${offer.slug}: ${message}`);
  }
}

function readBound(value: string | null, fallback: number, min: number, max: number) {
  if (value == null || value === "") return { ok: true as const, value: fallback };
  if (!/^\d+$/.test(value)) {
    return { ok: false as const, message: "Use um inteiro não negativo." };
  }
  const parsed = Number(value);
  if (parsed < min || parsed > max) {
    return { ok: false as const, message: `O valor precisa estar entre ${min} e ${max}.` };
  }
  return { ok: true as const, value: parsed };
}
