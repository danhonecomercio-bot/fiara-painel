import { getOffers, postOffers } from "@/lib/api/handlers";
import { getOfferRepository } from "@/lib/data/repository-factory";

export async function POST(request: Request) {
  try {
    const repo = await getOfferRepository();
    return postOffers(request, repo, process.env.BOT_API_KEY);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gravar ofertas.";
    return Response.json({ error: "falha_interna", message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const repo = await getOfferRepository();
    return getOffers(request, repo, process.env.BOT_API_KEY);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao listar ofertas.";
    return Response.json({ error: "falha_interna", message }, { status: 500 });
  }
}
