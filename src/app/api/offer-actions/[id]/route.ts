import { z } from "zod";
import { bearerMatches } from "@/lib/api/handlers";
import { getActionStore } from "@/lib/actions/store";
import { stripTracking } from "@/lib/offers/format";

const patchSchema = z
  .object({
    status: z.enum(["done", "failed"]),
    result_url: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional()
      .transform((value) => {
        if (value == null || value === "") return null;
        return stripTracking(value);
      }),
    error: z.string().trim().max(4000).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.result_url) return;
    try {
      const url = new URL(value.result_url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["result_url"], message: "result_url precisa ser http(s)." });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["result_url"], message: "result_url precisa ser http(s)." });
    }
  });

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.BOT_API_KEY;
  if (!apiKey) {
    return json({ error: "nao_configurado", message: "BOT_API_KEY não está configurada no servidor." }, 500);
  }
  if (!bearerMatches(request.headers.get("authorization"), apiKey)) {
    return json({ error: "nao_autorizado", message: "Envie o header Authorization: Bearer <BOT_API_KEY>." }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "json_invalido", message: "O corpo não é JSON válido." }, 400);
  }

  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      {
        error: "payload_invalido",
        message: "O corpo não passou na validação.",
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
      400,
    );
  }

  const { id } = await context.params;
  const updated = await getActionStore().update(id, {
    status: parsed.data.status,
    result_url: parsed.data.result_url,
    error: parsed.data.status === "failed" ? (parsed.data.error ?? "Falhou.") : parsed.data.error ?? null,
  });
  if (!updated) return json({ error: "nao_encontrada", message: "Não há pedido com esse id." }, 404);
  return json({ ok: true, action: updated });
}
