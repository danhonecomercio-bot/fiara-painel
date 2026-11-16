import { z } from "zod";
import { stripTracking } from "./format";

export const OPPORTUNITIES = [
  "alta",
  "media",
  "baixa",
  "nenhuma",
  "nao_avaliada",
] as const;

export const FUNNELS = ["Quiz", "LP", "Quiz+LP", "Quiz+VSL", "VSL"] as const;

export const STATUSES = ["active", "paused"] as const;

export const OPPORTUNITY_LABEL: Record<(typeof OPPORTUNITIES)[number], string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
  nenhuma: "Nenhuma",
  nao_avaliada: "Não avaliada",
};

const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const librarySchema = z
  .object({
    page_name: z.string().trim().min(1, "Informe page_name.").max(200),
    library_url: z
      .string()
      .trim()
      .min(1, "Informe library_url.")
      .max(2000)
      .transform(stripTracking)
      .refine((value) => isHttpUrl(value), "library_url precisa ser uma URL http(s)."),
    active_ads: z
      .number()
      .int("active_ads precisa ser inteiro.")
      .nonnegative("active_ads não pode ser negativo.")
      .max(1_000_000),
  })
  .strict();

export const orderBumpSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título do order bump.").max(300),
    description: optionalText(2000),
    price_cash: optionalText(120),
    price_installments: optionalText(120),
  })
  .strict();

export const upsellSchema = z
  .object({
    kind: z.enum(["upsell", "downsell"], {
      errorMap: () => ({ message: "kind precisa ser upsell ou downsell." }),
    }),
    title: z.string().trim().min(1, "Informe o título do upsell.").max(300),
    url: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional()
      .transform((value) => (value ? stripTracking(value) : value)),
    price: optionalText(120),
  })
  .strict();

const offerFields = {
  niche: optionalText(120),
  language_country: optionalText(120),
  opportunity: z.enum(OPPORTUNITIES).optional(),
  opportunity_score: z
    .number()
    .int("opportunity_score precisa ser inteiro.")
    .min(0, "opportunity_score vai de 0 a 5.")
    .max(5, "opportunity_score vai de 0 a 5.")
    .nullable()
    .optional(),
  opportunity_notes: optionalText(8000),
  google_library_url: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((value) => {
      if (value == null || value === "") return value === undefined ? undefined : null;
      return stripTracking(value);
    })
    .refine((value) => value == null || value === "" || isHttpUrl(value), {
      message: "google_library_url precisa ser uma URL http(s).",
    }),
  expert: z.boolean().optional(),
  promise: optionalText(2000),
  front_ticket: optionalText(200),
  funnel_model: z.enum(FUNNELS).nullable().optional(),
  running_since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "running_since precisa ser YYYY-MM-DD.")
    .nullable()
    .optional(),
  destination_urls: z
    .array(z.string().trim().min(1).max(2000).transform(stripTracking))
    .max(40)
    .optional(),
  checkout_url: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((value) => (value ? stripTracking(value) : value)),
  order_bumps: z.array(orderBumpSchema).max(20).optional(),
  upsells: z.array(upsellSchema).max(20).optional(),
  modeling_notes: optionalText(8000),
  raw: z.record(z.unknown()).nullable().optional(),
  status: z.enum(STATUSES).optional(),
};

export const minedOfferSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1, "Informe o slug.")
      .max(160)
      .regex(/^[^\s/]+$/, "slug não pode ter espaço nem barra."),
    title: z.string().trim().min(1, "Informe o título.").max(300),
    ...offerFields,
    libraries: z
    .array(librarySchema)
    .min(1, "Informe ao menos uma biblioteca da Meta.")
    .max(40),
    captured_at: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), "captured_at inválido.")
      .optional(),
  })
  .strict()
  .superRefine((offer, ctx) => {
    const seen = new Set<string>();
    offer.libraries.forEach((library, index) => {
      if (seen.has(library.library_url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["libraries", index, "library_url"],
          message: "library_url repetida neste payload.",
        });
      }
      seen.add(library.library_url);
    });
  });

export const offerPatchSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título.").max(300).optional(),
    ...offerFields,
  })
  .strict()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Informe ao menos um campo para atualizar.",
  });

export const postBodySchema = z
  .object({
    offers: z.array(minedOfferSchema).min(1, "Envie ao menos uma oferta.").max(100),
  })
  .strict();

export type LibraryInput = z.infer<typeof librarySchema>;
export type OrderBump = z.infer<typeof orderBumpSchema>;
export type Upsell = z.infer<typeof upsellSchema>;
export type MinedOffer = z.infer<typeof minedOfferSchema>;
export type OfferPatch = z.infer<typeof offerPatchSchema>;
export type Opportunity = (typeof OPPORTUNITIES)[number];
export type FunnelModel = (typeof FUNNELS)[number];
export type OfferStatus = (typeof STATUSES)[number];

export function normalizePostBody(value: unknown) {
  if (Array.isArray(value)) return { offers: value };
  if (value && typeof value === "object" && "slug" in value) return { offers: [value] };
  return value;
}

export function zodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
