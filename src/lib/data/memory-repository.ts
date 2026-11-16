import { randomUUID } from "node:crypto";
import type { MinedOffer, OfferPatch, Opportunity, OfferStatus } from "../offers/schema";
import type {
  ListQuery,
  OfferCard,
  OfferDetail,
  SnapshotRow,
  UpsertResult,
} from "../offers/types";
import type { OfferRepository } from "./repository";

const OPTIONAL_KEYS = [
  "niche",
  "language_country",
  "opportunity",
  "opportunity_notes",
  "expert",
  "promise",
  "front_ticket",
  "funnel_model",
  "running_since",
  "destination_urls",
  "checkout_url",
  "order_bumps",
  "upsells",
  "modeling_notes",
  "raw",
  "status",
] as const;

function blankOffer(id: string, slug: string, title: string, now: string): OfferDetail {
  return {
    id,
    slug,
    title,
    niche: null,
    language_country: null,
    opportunity: "nao_avaliada",
    opportunity_notes: null,
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
    raw: {},
    status: "active",
    created_at: now,
    updated_at: now,
    libraries: [],
    snapshots: [],
  };
}

export class MemoryOfferRepository implements OfferRepository {
  private offers = new Map<string, OfferDetail>();

  async upsertMinedOffer(input: MinedOffer): Promise<UpsertResult> {
    const now = new Date().toISOString();
    const existing = this.offers.get(input.slug);
    const created = !existing;
    const id = existing?.id ?? randomUUID();
    const next = existing
      ? { ...existing, libraries: [...existing.libraries], snapshots: [...existing.snapshots] }
      : blankOffer(id, input.slug, input.title, now);

    next.title = input.title;
    next.updated_at = now;
    for (const key of OPTIONAL_KEYS) {
      if (input[key] !== undefined) {
        assign(next, key, input[key]);
      }
    }

    const capturedAt = input.captured_at
      ? new Date(input.captured_at).toISOString()
      : now;
    const total = input.libraries.reduce((sum, library) => sum + library.active_ads, 0);
    const snapshotId = randomUUID();
    const snapshot: SnapshotRow = {
      captured_at: capturedAt,
      total_active_ads: total,
      per_library: input.libraries.map((library) => ({ ...library })),
    };
    next.libraries = input.libraries.map((library) => ({ ...library }));
    next.snapshots = [snapshot, ...next.snapshots].sort((a, b) =>
      b.captured_at.localeCompare(a.captured_at),
    );
    this.offers.set(input.slug, next);

    return {
      id,
      slug: input.slug,
      created,
      total_active_ads: total,
      snapshot_id: snapshotId,
    };
  }

  async patchOffer(slug: string, patch: OfferPatch): Promise<OfferDetail | null> {
    const existing = this.offers.get(slug);
    if (!existing) return null;
    const next: OfferDetail = {
      ...existing,
      libraries: existing.libraries.map((library) => ({ ...library })),
      snapshots: existing.snapshots.map((snapshot) => ({
        ...snapshot,
        per_library: snapshot.per_library.map((library) => ({ ...library })),
      })),
      updated_at: new Date().toISOString(),
    };
    for (const key of OPTIONAL_KEYS) {
      if (key in patch && patch[key] !== undefined) {
        assign(next, key, patch[key]);
      }
    }
    if (patch.title !== undefined) next.title = patch.title;
    this.offers.set(slug, next);
    return cloneDetail(next);
  }

  async listOffers(query: ListQuery): Promise<OfferDetail[]> {
    let rows = [...this.offers.values()];
    if (query.since) {
      const since = Date.parse(query.since);
      rows = rows.filter((row) => Date.parse(row.updated_at) >= since);
    }
    rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at) || a.slug.localeCompare(b.slug));
    return rows.slice(query.offset, query.offset + query.limit).map((row) => {
      const detail = cloneDetail(row);
      detail.snapshots = detail.snapshots.slice(0, 30);
      return detail;
    });
  }

  listCards(): OfferCard[] {
    return [...this.offers.values()].map((offer) => {
      const latest = offer.snapshots[0] ?? null;
      const previous = offer.snapshots[1] ?? null;
      return {
        id: offer.id,
        slug: offer.slug,
        title: offer.title,
        niche: offer.niche,
        language_country: offer.language_country,
        opportunity: offer.opportunity,
        expert: offer.expert,
        promise: offer.promise,
        front_ticket: offer.front_ticket,
        funnel_model: offer.funnel_model,
        status: offer.status,
        running_since: offer.running_since,
        updated_at: offer.updated_at,
        created_at: offer.created_at,
        is_example: offer.raw?.example === true,
        total_active_ads: latest?.total_active_ads ?? null,
        last_captured_at: latest?.captured_at ?? null,
        prev_total_active_ads: previous?.total_active_ads ?? null,
        prev_captured_at: previous?.captured_at ?? null,
        library_names: offer.libraries
          .map((library) => library.page_name)
          .sort((a, b) => a.localeCompare(b, "pt-BR")),
      };
    });
  }

  getDetail(slug: string): OfferDetail | null {
    const offer = this.offers.get(slug);
    return offer ? cloneDetail(offer) : null;
  }
}

function cloneDetail(offer: OfferDetail): OfferDetail {
  return {
    ...offer,
    destination_urls: [...offer.destination_urls],
    order_bumps: offer.order_bumps.map((bump) => ({ ...bump })),
    upsells: offer.upsells.map((upsell) => ({ ...upsell })),
    raw: offer.raw ? { ...offer.raw } : null,
    libraries: offer.libraries.map((library) => ({ ...library })),
    snapshots: offer.snapshots.map((snapshot) => ({
      ...snapshot,
      per_library: snapshot.per_library.map((library) => ({ ...library })),
    })),
  };
}

function assign(
  target: OfferDetail,
  key: (typeof OPTIONAL_KEYS)[number],
  value: MinedOffer[(typeof OPTIONAL_KEYS)[number]] | OfferPatch[(typeof OPTIONAL_KEYS)[number]],
) {
  switch (key) {
    case "opportunity":
      target.opportunity = (value as Opportunity | undefined) ?? target.opportunity;
      break;
    case "status":
      target.status = (value as OfferStatus | undefined) ?? target.status;
      break;
    case "expert":
      target.expert = Boolean(value);
      break;
    case "destination_urls":
      target.destination_urls = [...((value as string[] | undefined) ?? [])];
      break;
    case "order_bumps":
      target.order_bumps = ((value as OfferDetail["order_bumps"] | undefined) ?? []).map((bump) => ({
        ...bump,
      }));
      break;
    case "upsells":
      target.upsells = ((value as OfferDetail["upsells"] | undefined) ?? []).map((upsell) => ({
        ...upsell,
      }));
      break;
    case "raw":
      target.raw = (value as OfferDetail["raw"]) ?? null;
      break;
    default:
      Reflect.set(target, key, value ?? null);
  }
}
