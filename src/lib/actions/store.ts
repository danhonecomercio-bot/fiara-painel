import "server-only";
import { isDemoMode } from "../demo-mode";
import { createServiceClient } from "../supabase/admin";
import { getDemoActionStore } from "./memory-store";
import { createSupabaseActionStore } from "./supabase-store";
import type { ActionStore } from "./types";

export function getActionStore(): ActionStore {
  if (isDemoMode()) return getDemoActionStore();
  return createSupabaseActionStore(createServiceClient());
}
