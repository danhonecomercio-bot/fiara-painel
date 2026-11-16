import "server-only";
import { isDemoMode } from "../demo-mode";
import { createServiceClient } from "../supabase/admin";
import { getDemoRepository } from "./demo-store";
import type { OfferRepository } from "./repository";
import { SupabaseOfferRepository } from "./supabase-repository";

export async function getOfferRepository(): Promise<OfferRepository> {
  if (isDemoMode()) return getDemoRepository();
  return new SupabaseOfferRepository(createServiceClient());
}
