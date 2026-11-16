import { createClient } from "@supabase/supabase-js";
import { SupabaseOfferRepository } from "../src/lib/data/supabase-repository";
import { seedExampleOffers } from "../src/lib/offers/examples";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const repo = new SupabaseOfferRepository(client);
await seedExampleOffers(repo);
console.log("Três ofertas de exemplo gravadas. Os títulos começam com \"Exemplo:\".");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // arquivo opcional
    }
  }
}
