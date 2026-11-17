import { deleteOfferBySlug, patchOfferBySlug } from "@/lib/api/handlers";
import { getOfferRepository } from "@/lib/data/repository-factory";

export async function PATCH(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  try {
    const repo = await getOfferRepository();
    return patchOfferBySlug(request, slug, repo, process.env.BOT_API_KEY);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar a oferta.";
    return Response.json({ error: "falha_interna", message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  try {
    const repo = await getOfferRepository();
    return deleteOfferBySlug(request, slug, repo, process.env.BOT_API_KEY);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao apagar a oferta.";
    return Response.json({ error: "falha_interna", message }, { status: 500 });
  }
}
