import "server-only";
import { isDemoMode } from "../demo-mode";
import { createClient } from "../supabase/server";
import { getDemoRepository } from "./demo-store";
import { mapCardRow, mapOfferRow } from "./map-offer";

export async function listOfferCards() {
  if (isDemoMode()) {
    const repo = await getDemoRepository();
    return repo.listCards();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("offer_cards").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCardRow(row));
}

export async function getOfferDetail(slug: string) {
  if (isDemoMode()) {
    const repo = await getDemoRepository();
    return repo.getDetail(slug);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select(
      `
        id, slug, title, niche, language_country, opportunity, opportunity_notes,
        expert, promise, front_ticket, funnel_model, running_since,
        destination_urls, checkout_url, order_bumps, upsells, modeling_notes,
        raw, status, created_at, updated_at,
        offer_libraries (page_name, library_url, active_ads),
        offer_snapshots (captured_at, total_active_ads, per_library)
      `,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapOfferRow(data);
}
