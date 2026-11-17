import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActionStore, OfferAction, OfferActionName, OfferActionStatus } from "./types";

function asAction(row: unknown): OfferAction {
  const record = row as Record<string, unknown>;
  return {
    id: String(record.id),
    offer_id: String(record.offer_id),
    action: record.action as OfferActionName,
    status: record.status as OfferActionStatus,
    requested_by: String(record.requested_by ?? ""),
    result_url: record.result_url == null ? null : String(record.result_url),
    error: record.error == null ? null : String(record.error),
    created_at: String(record.created_at),
  };
}

export function createSupabaseActionStore(client: SupabaseClient): ActionStore {
  return {
    async insert(action) {
      const { error } = await client.from("offer_actions").insert(action);
      if (error) throw new Error(error.message);
    },
    async update(id, patch) {
      const { data, error } = await client
        .from("offer_actions")
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? asAction(data) : null;
    },
    async get(id) {
      const { data, error } = await client.from("offer_actions").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? asAction(data) : null;
    },
    async latestForOffer(offerId) {
      const { data, error } = await client
        .from("offer_actions")
        .select("*")
        .eq("offer_id", offerId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      const latest = new Map<string, OfferAction>();
      for (const row of data ?? []) {
        const action = asAction(row);
        if (!latest.has(action.action)) latest.set(action.action, action);
      }
      return [...latest.values()];
    },
    async listForOffer(offerId) {
      const { data, error } = await client
        .from("offer_actions")
        .select("*")
        .eq("offer_id", offerId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => asAction(row));
    },
  };
}
