import { stripTracking } from "../offers/format";
import type { OfferDetail } from "../offers/types";
import type { OfferActionName } from "./types";

export type WebhookConfig = { url: string; key: string };

export function webhookConfig(action: OfferActionName): WebhookConfig | null {
  const urlName = action === "baixar_top_ads" ? "TOPADS_WEBHOOK_URL" : "MODELADOR_WEBHOOK_URL";
  const keyName = action === "baixar_top_ads" ? "TOPADS_WEBHOOK_KEY" : "MODELADOR_WEBHOOK_KEY";
  const url = process.env[urlName]?.trim();
  const key = process.env[keyName]?.trim();
  if (!url || !key) return null;
  return { url, key };
}

export function webhookBody(input: {
  action: OfferActionName;
  offer: Pick<OfferDetail, "slug" | "title" | "libraries">;
  requestedBy: string;
  requestedAt: string;
}) {
  return {
    action: input.action,
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
