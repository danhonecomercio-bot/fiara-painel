import { notFound } from "next/navigation";
import { OfferDetailView } from "@/components/offer-detail";
import { getOfferDetail } from "@/lib/data/read-offers";

export const metadata = { title: "Oferta" };

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const offer = await getOfferDetail(decodeURIComponent(slug));
  if (!offer) notFound();
  return <OfferDetailView offer={offer} />;
}
