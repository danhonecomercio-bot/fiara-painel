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
  const detailSelect = `
        id, slug, title, niche, language_country, opportunity, opportunity_score, opportunity_notes, google_library_url,
        expert, promise, front_ticket, funnel_model, running_since,
        destination_urls, checkout_url, order_bumps, upsells, modeling_notes,
        raw, status, created_at, updated_at,
        offer_libraries (page_name, library_url, active_ads),
        offer_snapshots (captured_at, total_active_ads, per_library)
      `;
  const legacySelect = detailSelect
    .replace("opportunity_score, ", "")
    .replace("google_library_url,\n", "");
  const first = await supabase.from("offers").select(detailSelect).eq("slug", slug).maybeSingle();
  const result =
    first.error && /opportunity_score|google_library_url/.test(first.error.message)
      ? await supabase.from("offers").select(legacySelect).eq("slug", slug).maybeSingle()
      : first;
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;
  return mapOfferRow(result.data);
}
