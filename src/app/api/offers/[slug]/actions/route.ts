import { z } from "zod";
import { requestOfferAction, ActionRequestError } from "@/lib/actions/request";
import { getActionStore } from "@/lib/actions/store";
import { OFFER_ACTIONS } from "@/lib/actions/types";
import { webhookConfig } from "@/lib/actions/webhook";
import { readCurrentUser } from "@/lib/auth/session";
import { getOfferDetail } from "@/lib/data/read-offers";

const bodySchema = z
  .object({
    action: z.enum(OFFER_ACTIONS),
  })
  .strict();

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const user = await readCurrentUser();
  if (!user) return json({ error: "nao_autorizado", message: "Entre no painel para consultar o pedido." }, 401);

  const { slug } = await context.params;
  const offer = await getOfferDetail(decodeURIComponent(slug));
  if (!offer) return json({ error: "nao_encontrada", message: "Não há oferta com esse slug." }, 404);

  const actions = await getActionStore().latestForOffer(offer.id);
  return json({ ok: true, actions });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const user = await readCurrentUser();
  if (!user?.email) {
    return json({ error: "nao_autorizado", message: "Entre no painel para pedir esta ação." }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "json_invalido", message: "O corpo não é JSON válido." }, 400);
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return json({ error: "payload_invalido", message: "Informe action baixar_top_ads ou modelar." }, 400);
  }

  const { slug } = await context.params;
  const offer = await getOfferDetail(decodeURIComponent(slug));
  if (!offer) return json({ error: "nao_encontrada", message: "Não há oferta com esse slug." }, 404);

  try {
    const action = await requestOfferAction({
      offer,
      action: parsed.data.action,
      requestedBy: user.email,
      store: getActionStore(),
      config: webhookConfig(parsed.data.action),
    });
    return json({ ok: true, action });
  } catch (error) {
    if (error instanceof ActionRequestError) {
      return json({ error: "nao_configurado", message: error.message }, error.status);
    }
    const message = error instanceof Error ? error.message : "Falha ao registrar o pedido.";
    return json({ error: "falha_interna", message }, 500);
  }
}
