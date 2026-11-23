import { stripTracking } from "../offers/format";
import type { OfferDetail } from "../offers/types";
import type { OfferActionName } from "./types";

export type WebhookConfig = { url: string; key: string };

function pair(urlName: string, keyName: string): WebhookConfig | null {
  const url = process.env[urlName]?.trim();
  const key = process.env[keyName]?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export function webhookConfig(action: OfferActionName): WebhookConfig | null {
  if (action === "baixar_top_ads" || action === "dissecar") {
    return (
      pair("DISSECADOR_WEBHOOK_URL", "DISSECADOR_WEBHOOK_KEY") ??
      pair("TOPADS_WEBHOOK_URL", "TOPADS_WEBHOOK_KEY")
    );
  }
  if (action === "varredura_idiomas") {
    return (
      pair("MINERADOR_WEBHOOK_URL", "MINERADOR_WEBHOOK_KEY") ??
      pair("DISSECADOR_WEBHOOK_URL", "DISSECADOR_WEBHOOK_KEY")
    );
  }
  return pair("MODELADOR_WEBHOOK_URL", "MODELADOR_WEBHOOK_KEY");
}

export function webhookBody(input: {
  action: OfferActionName;
  actionId: string;
  offer: Pick<OfferDetail, "slug" | "title" | "libraries">;
  requestedBy: string;
  requestedAt: string;
}) {
  return {
    action: input.action,
    action_id: input.actionId,
    slug: input.offer.slug,
    title: input.offer.title,
    funnel_slug: input.offer.slug.toLowerCase(),
    meta_library_urls: input.offer.libraries.map((library) => stripTracking(library.library_url)),
    requested_by: input.requestedBy,
    requested_at: input.requestedAt,
  };
}

export async function postWebhook(config: WebhookConfig, body: ReturnType<typeof webhookBody>) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.key}`,
      "x-automation-key": config.key,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const detail = text.replace(/\s+/g, " ").trim().slice(0, 240);
    throw new Error(detail ? `Webhook respondeu ${response.status}: ${detail}` : `Webhook respondeu ${response.status}.`);
  }
}
