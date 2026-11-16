export function isDemoMode() {
  if (process.env.DEMO_MODE !== "true") return false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return false;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  return true;
}
