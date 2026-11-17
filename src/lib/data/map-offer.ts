import { normalizeScore } from "../offers/format";
import { isModelingOpportunity } from "../offers/query";
import type { FunnelModel, Opportunity, OfferStatus } from "../offers/schema";
import type { LibraryRow, OfferCard, OfferDetail, SnapshotRow } from "../offers/types";

const OPPORTUNITIES = new Set(["alta", "media", "baixa", "nenhuma", "nao_avaliada"]);
const STATUSES = new Set(["active", "paused"]);

export function mapOfferRow(row: unknown): OfferDetail {
  const record = asRecord(row);
  const raw = record.raw == null ? null : asRecord(record.raw);
  const libraries = asLibraries(record.offer_libraries ?? record.libraries);
  const snapshots = asSnapshots(record.offer_snapshots ?? record.snapshots).sort((a, b) =>
    b.captured_at.localeCompare(a.captured_at),
  );

  return {
    id: asString(record.id),
    slug: asString(record.slug),
    title: asString(record.title),
    niche: asNullableString(record.niche),
    language_country: asNullableString(record.language_country),
    opportunity: asOpportunity(record.opportunity),
    opportunity_score: scoreFromRow(record),
    score_breakdown: asBreakdown(record.score_breakdown),
    opportunity_notes: asNullableString(record.opportunity_notes),
    google_library_url: asNullableString(record.google_library_url),
    expert: record.expert === true,
    promise: asNullableString(record.promise),
    front_ticket: asNullableString(record.front_ticket),
    funnel_model: asFunnel(record.funnel_model),
    running_since: asNullableString(record.running_since)?.slice(0, 10) ?? null,
    destination_urls: asStringArray(record.destination_urls),
    checkout_url: asNullableString(record.checkout_url),
    order_bumps: asObjectArray(record.order_bumps),
    upsells: asObjectArray(record.upsells),
    modeling_notes: asNullableString(record.modeling_notes),
    language_scan: asLanguageScan(record.language_scan),
    modeling_check: asModelingCheck(record.modeling_check),
    raw,
    status: asStatus(record.status),
    created_at: asString(record.created_at),
    updated_at: asString(record.updated_at),
    libraries,
    snapshots,
  };
}

export function mapCardRow(row: unknown): OfferCard {
  const record = asRecord(row);
  return {
    id: asString(record.id),
    slug: asString(record.slug),
    title: asString(record.title),
    niche: asNullableString(record.niche),
    language_country: asNullableString(record.language_country),
    opportunity: asOpportunity(record.opportunity),
    opportunity_score: scoreFromRow(record),
    modeling_opportunity: isModelingOpportunity(asModelingCheck(record.modeling_check)),
    expert: record.expert === true,
    promise: asNullableString(record.promise),
    front_ticket: asNullableString(record.front_ticket),
    funnel_model: asFunnel(record.funnel_model),
    status: asStatus(record.status),
    running_since: asNullableString(record.running_since)?.slice(0, 10) ?? null,
    updated_at: asString(record.updated_at),
    created_at: asString(record.created_at),
    is_example: record.is_example === true,
    total_active_ads: asNullableNumber(record.total_active_ads),
    last_captured_at: asNullableString(record.last_captured_at),
    prev_total_active_ads: asNullableNumber(record.prev_total_active_ads),
    prev_captured_at: asNullableString(record.prev_captured_at),
    library_names: asStringArray(record.library_names),
  };
}

function asLibraries(value: unknown): LibraryRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = asRecord(item);
    return {
      page_name: asString(row.page_name),
      library_url: asString(row.library_url),
      active_ads: asNumber(row.active_ads),
    };
  });
}

function asSnapshots(value: unknown): SnapshotRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = asRecord(item);
    return {
      captured_at: asString(row.captured_at),
      total_active_ads: asNumber(row.total_active_ads),
      per_library: asLibraries(row.per_library),
    };
  });
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Resposta inesperada do banco.");
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Resposta inesperada do banco.");
  }
  return value;
}

function asNullableString(value: unknown) {
  if (value == null) return null;
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error("Resposta inesperada do banco.");
  }
  return value;
}

function asNullableNumber(value: unknown) {
  if (value == null) return null;
  return typeof value === "number" ? value : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asObjectArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is T => Boolean(item) && typeof item === "object");
}

function scoreFromRow(record: Record<string, unknown>) {
  if ("opportunity_score" in record) return asScore(record.opportunity_score);
  const opportunity = asOpportunity(record.opportunity);
  if (opportunity === "alta") return 5;
  if (opportunity === "media") return 3;
  if (opportunity === "baixa") return 1;
  if (opportunity === "nenhuma") return 0;
  return null;
}

const SCAN_LANGS = ["es", "en", "fr", "de", "it", "pt"] as const;

function asLanguageScan(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.ran_at !== "string" || Number.isNaN(Date.parse(record.ran_at))) return null;
  if (!record.results || typeof record.results !== "object") return null;
  const source = record.results as Record<string, unknown>;
  const results: NonNullable<OfferDetail["language_scan"]>["results"] = {};
  for (const lang of SCAN_LANGS) {
    if (!(lang in source)) continue;
    const items = source[lang];
    if (!Array.isArray(items)) return null;
    results[lang] = items.map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        name: asString(row.name),
        library_url: asString(row.library_url),
        active_ads: asNullableNumber(row.active_ads) ?? 0,
        front_ticket: asString(row.front_ticket),
        page_url: asNullableString(row.page_url),
        checkout_url: asNullableString(row.checkout_url),
      };
    });
  }
  return { ran_at: record.ran_at, results };
}

function asBreakdown(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      criterion: asString(row.criterion),
      detail: asString(row.detail),
      points: normalizeScore(row.points) ?? 0,
    };
  });
}

function asModelingCheck(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.checked_at !== "string") return null;
  const techniques = Array.isArray(record.techniques)
    ? record.techniques.map((item) => {
        const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return {
          rank: typeof row.rank === "number" ? row.rank : 0,
          key: asString(row.key),
          name: asString(row.name),
          available: row.available === true,
          why: asString(row.why),
          suggestion: asString(row.suggestion),
        };
      })
    : [];
  return { checked_at: record.checked_at, summary: asString(record.summary), techniques };
}

function asScore(value: unknown) {
  return normalizeScore(value);
}

function asOpportunity(value: unknown): Opportunity {
  if (typeof value === "string" && OPPORTUNITIES.has(value)) return value as Opportunity;
  return "nao_avaliada";
}

function asFunnel(value: unknown): FunnelModel | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}

function asStatus(value: unknown): OfferStatus {
  if (typeof value === "string" && STATUSES.has(value)) return value as OfferStatus;
  return "active";
}
