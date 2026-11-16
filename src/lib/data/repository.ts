import type { MinedOffer, OfferPatch } from "../offers/schema";
import type { ListQuery, OfferDetail, UpsertResult } from "../offers/types";

export interface OfferRepository {
  upsertMinedOffer(input: MinedOffer): Promise<UpsertResult>;
  patchOffer(slug: string, patch: OfferPatch): Promise<OfferDetail | null>;
  listOffers(query: ListQuery): Promise<OfferDetail[]>;
}
