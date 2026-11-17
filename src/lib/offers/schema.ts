import { z } from "zod";
import { isHalfStepScore, stripTracking } from "./format";

export const SCAN_LANGUAGES = ["es", "en", "fr", "de", "it", "pt"] as const;

const trackedUrl = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Informe ${label}.`)
    .max(2000)
    .transform(stripTracking)
    .refine((value) => isHttpUrl(value), `${label} precisa ser uma URL http(s).`);

const optionalTrackedUrl = (label: string) =>
  z
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
      message: `${label} precisa ser uma URL http(s).`,
    });

const languageScanItemSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome da oferta encontrada.").max(300),
    library_url: trackedUrl("library_url"),
    active_ads: z.number().int("active_ads precisa ser inteiro.").nonnegative().max(1_000_000),
    front_ticket: z.string().trim().max(200),
    page_url: optionalTrackedUrl("page_url"),
    checkout_url: optionalTrackedUrl("checkout_url"),
  })
  .strict();

const keptScanItems = z
  .array(languageScanItemSchema)
  .max(40)
  .transform((items) => items.filter((item) => item.active_ads >= 60));

const languageScanResults = z
  .object({
    es: keptScanItems.optional(),
    en: keptScanItems.optional(),
    fr: keptScanItems.optional(),
    de: keptScanItems.optional(),
    it: keptScanItems.optional(),
    pt: keptScanItems.optional(),
  })
  .strict();

const languageScanSchema = z
  .object({
    ran_at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "ran_at inválido."),
    results: languageScanResults,
  })
  .strict()
  .nullable()
  .optional();

export const OPPORTUNITIES = [
  "alta",
  "media",
  "baixa",
  "nenhuma",
  "nao_avaliada",
] as const;

export const FUNNELS = ["LP", "Quiz+LP", "Quiz+MiniVSL", "Quiz+VSL", "VSL", "Outro"] as const;

const scoreBreakdownSchema = z
  .array(
    z
      .object({
        criterion: z.string().trim().min(1, "Informe o critério.").max(200),
        detail: z.string().trim().max(2000),
        points: z.number().refine(isHalfStepScore, "points vai de 0 a 5, de meio em meio."),
      })
      .strict(),
  )
  .max(20)
  .nullable()
  .optional();

const modelingTechniqueSchema = z
  .object({
    rank: z.number().int("rank precisa ser inteiro.").min(1).max(100),
    key: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(200),
    available: z.boolean(),
    why: z.string().trim().max(2000),
    suggestion: z.string().trim().max(2000),
  })
  .strict();

const modelingCheckSchema = z
  .object({
    checked_at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "checked_at inválido."),
    summary: z.string().trim().max(4000),
    techniques: z.array(modelingTechniqueSchema).max(40),
  })
  .strict()
  .nullable()
  .optional();

function applyScoreBreakdown(
  value: {
    score_breakdown?: { points: number }[] | null;
    opportunity_score?: number | null;
  },
  ctx: z.RefinementCtx,
) {
  if (!value.score_breakdown) return;
  const raw = value.score_breakdown.reduce((sum, item) => sum + item.points, 0);
  const total = Math.round(raw * 2) / 2;
  if (!isHalfStepScore(total)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["score_breakdown"],
      message: "A soma dos pontos precisa ficar entre 0 e 5, de meio em meio.",
    });
    return;
  }
  value.opportunity_score = total;
}

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
    .refine(isHalfStepScore, "opportunity_score vai de 0 a 5, de meio em meio.")
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
  funnel_model: z.string().trim().min(1).max(80).nullable().optional(),
  score_breakdown: scoreBreakdownSchema,
  modeling_check: modelingCheckSchema,
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
  language_scan: languageScanSchema,
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
    applyScoreBreakdown(offer, ctx);
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
  .superRefine((value, ctx) => applyScoreBreakdown(value, ctx))
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
export type FunnelModel = string;
export type ScoreBreakdownItem = { criterion: string; detail: string; points: number };
export type ModelingTechnique = {
  rank: number;
  key: string;
  name: string;
  available: boolean;
  why: string;
  suggestion: string;
};
export type ModelingCheck = {
  checked_at: string;
  summary: string;
  techniques: ModelingTechnique[];
};
export type OfferStatus = (typeof STATUSES)[number];
export type LanguageScanItem = z.infer<typeof languageScanItemSchema>;
export type LanguageScan = NonNullable<z.infer<typeof languageScanSchema>>;

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
