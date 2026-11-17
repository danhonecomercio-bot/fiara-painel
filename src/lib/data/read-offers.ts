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
  const optional = ["score_breakdown", "modeling_check", "language_scan", "opportunity_score", "google_library_url"];
  const detailSelect = `
        id, slug, title, niche, language_country, opportunity, opportunity_score, score_breakdown, opportunity_notes, google_library_url,
        expert, promise, front_ticket, funnel_model, running_since,
        destination_urls, checkout_url, order_bumps, upsells, modeling_notes, language_scan, modeling_check,
        raw, status, created_at, updated_at,
        offer_libraries (page_name, library_url, active_ads),
        offer_snapshots (captured_at, total_active_ads, per_library)
      `;
  const without = (message: string) =>
    optional.reduce((sql, column) => (message.includes(column) ? sql.replace(new RegExp(`,\\s*${column}\\b`), "") : sql), detailSelect);
  let result = await supabase.from("offers").select(detailSelect).eq("slug", slug).maybeSingle();
  if (result.error && optional.some((column) => result.error?.message.includes(column))) {
    result = await supabase.from("offers").select(without(result.error.message)).eq("slug", slug).maybeSingle();
  }
  if (result.error) throw new Error(result.error.message);
  if (!result.data) return null;
  return mapOfferRow(result.data);
}
