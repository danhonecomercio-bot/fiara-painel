import type { SupabaseClient } from "@supabase/supabase-js";
import type { MinedOffer, OfferPatch } from "../offers/schema";
import type { ListQuery, OfferDetail, UpsertResult } from "../offers/types";
import { mapOfferRow } from "./map-offer";
import type { OfferRepository } from "./repository";

const OFFER_COLUMNS = [
  "niche",
  "language_country",
  "opportunity",
  "opportunity_score",
  "opportunity_notes",
  "google_library_url",
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
  "language_scan",
  "raw",
  "status",
] as const;

const OFFER_SELECT = `
  id, slug, title, niche, language_country, opportunity, opportunity_score, opportunity_notes, google_library_url,
  expert, promise, front_ticket, funnel_model, running_since,
  destination_urls, checkout_url, order_bumps, upsells, modeling_notes, language_scan,
  raw, status, created_at, updated_at,
  offer_libraries (page_name, library_url, active_ads),
  offer_snapshots (captured_at, total_active_ads, per_library)
`;

const OFFER_SELECT_LEGACY = OFFER_SELECT.replace("modeling_notes, language_scan,", "modeling_notes,");

function missingScan(message: string) {
  return /language_scan/.test(message);
}

export class SupabaseOfferRepository implements OfferRepository {
  constructor(private client: SupabaseClient) {}

  async upsertMinedOffer(input: MinedOffer): Promise<UpsertResult> {
    const { data: existing, error: existingError } = await this.client
      .from("offers")
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);

    const payload: Record<string, unknown> = {
      slug: input.slug,
      title: input.title,
    };
    for (const key of OFFER_COLUMNS) {
      if (input[key] !== undefined) payload[key] = input[key];
    }

    const { data, error } = await this.client
      .from("offers")
      .upsert(payload, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);

    const offerId = String(data.id);
    const { error: deleteError } = await this.client
      .from("offer_libraries")
      .delete()
      .eq("offer_id", offerId);
    if (deleteError) throw new Error(deleteError.message);

    if (input.libraries.length > 0) {
      const { error: insertLibrariesError } = await this.client.from("offer_libraries").insert(
        input.libraries.map((library) => ({
          offer_id: offerId,
          page_name: library.page_name,
          library_url: library.library_url,
          active_ads: library.active_ads,
        })),
      );
      if (insertLibrariesError) throw new Error(insertLibrariesError.message);
    }

    const total = input.libraries.reduce((sum, library) => sum + library.active_ads, 0);
    const { data: snapshot, error: snapshotError } = await this.client
      .from("offer_snapshots")
      .insert({
        offer_id: offerId,
        captured_at: input.captured_at ? new Date(input.captured_at).toISOString() : new Date().toISOString(),
        total_active_ads: total,
        per_library: input.libraries,
      })
      .select("id")
      .single();
    if (snapshotError) throw new Error(snapshotError.message);

    return {
      id: offerId,
      slug: input.slug,
      created: !existing,
      total_active_ads: total,
      snapshot_id: String(snapshot.id),
    };
  }

  async patchOffer(slug: string, patch: OfferPatch): Promise<OfferDetail | null> {
    const payload: Record<string, unknown> = {};
    if (patch.title !== undefined) payload.title = patch.title;
    for (const key of OFFER_COLUMNS) {
      if (patch[key] !== undefined) payload[key] = patch[key];
    }

    const first = await this.client
      .from("offers")
      .update(payload)
      .eq("slug", slug)
      .select(OFFER_SELECT)
      .maybeSingle();
    const row =
      first.error && missingScan(first.error.message) && payload.language_scan === undefined
        ? await this.client.from("offers").update(payload).eq("slug", slug).select(OFFER_SELECT_LEGACY).maybeSingle()
        : first;
    if (row.error) throw new Error(row.error.message);
    if (!row.data) return null;
    const detail = mapOfferRow(row.data);
    detail.snapshots = detail.snapshots.slice(0, 30);
    return detail;
  }

  async listOffers(query: ListQuery): Promise<OfferDetail[]> {
    let request = this.client
      .from("offers")
      .select(OFFER_SELECT)
      .order("updated_at", { ascending: false })
      .order("captured_at", { referencedTable: "offer_snapshots", ascending: false })
      .limit(30, { referencedTable: "offer_snapshots" })
      .range(query.offset, query.offset + query.limit - 1);

    if (query.since) request = request.gte("updated_at", new Date(query.since).toISOString());

    const first = await request;
    let rows: unknown[] = first.data ?? [];
    let failure = first.error?.message ?? null;
    if (first.error && missingScan(first.error.message)) {
      let legacy = this.client
        .from("offers")
        .select(OFFER_SELECT_LEGACY)
        .order("updated_at", { ascending: false })
        .order("captured_at", { referencedTable: "offer_snapshots", ascending: false })
        .limit(30, { referencedTable: "offer_snapshots" })
        .range(query.offset, query.offset + query.limit - 1);
      if (query.since) legacy = legacy.gte("updated_at", new Date(query.since).toISOString());
      const retry = await legacy;
      rows = retry.data ?? [];
      failure = retry.error?.message ?? null;
    }
    if (failure) throw new Error(failure);
    return rows.map((row) => {
      const detail = mapOfferRow(row);
      detail.snapshots = detail.snapshots.slice(0, 30);
      return detail;
    });
  }
}
