import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Defina SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(supabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
