import { randomUUID } from "node:crypto";
import type { OfferDetail } from "../offers/types";
import type { ActionStore, OfferAction, OfferActionName } from "./types";
import { postWebhook, webhookBody, type WebhookConfig } from "./webhook";

export async function requestOfferAction(input: {
  offer: Pick<OfferDetail, "id" | "slug" | "title" | "libraries">;
  action: OfferActionName;
  requestedBy: string;
  store: ActionStore;
  config: WebhookConfig | null;
  now?: Date;
  post?: typeof postWebhook;
}): Promise<OfferAction> {
  if (!input.config) {
    throw new ActionRequestError(
      input.action === "modelar" ? "em breve" : "não configurado",
      503,
    );
  }

  const requestedAt = (input.now ?? new Date()).toISOString();
  const row: OfferAction = {
    id: randomUUID(),
    offer_id: input.offer.id,
    action: input.action,
    status: "pending",
    requested_by: input.requestedBy,
    result_url: null,
    error: null,
    created_at: requestedAt,
  };
  await input.store.insert(row);

  const body = webhookBody({
    action: input.action,
    actionId: row.id,
    offer: input.offer,
    requestedBy: input.requestedBy,
    requestedAt,
  });

  try {
    await (input.post ?? postWebhook)(input.config, body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao chamar o webhook.";
    const failed = await input.store.update(row.id, { status: "failed", error: message });
    return failed ?? { ...row, status: "failed", error: message };
  }

  const sent = await input.store.update(row.id, { status: "sent", error: null });
  return sent ?? { ...row, status: "sent" };
}

export class ActionRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
