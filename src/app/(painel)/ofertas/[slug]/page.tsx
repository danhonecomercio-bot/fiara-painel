import { notFound } from "next/navigation";
import { OfferDetailView } from "@/components/offer-detail";
import { getActionStore } from "@/lib/actions/store";
import { webhookConfig } from "@/lib/actions/webhook";
import { getOfferDetail } from "@/lib/data/read-offers";

export const metadata = { title: "Oferta" };

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offer = await getOfferDetail(decodeURIComponent(slug));
  if (!offer) notFound();
  const actions = await getActionStore()
    .latestForOffer(offer.id)
    .catch(() => []);
  return (
    <OfferDetailView
      offer={offer}
      actions={actions}
      topadsReady={webhookConfig("baixar_top_ads") != null}
      modelarReady={webhookConfig("modelar") != null}
      varreduraReady={webhookConfig("varredura_idiomas") != null}
    />
  );
}
