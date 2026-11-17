import type { MinedOffer, OfferPatch } from "../offers/schema";
import type { ListQuery, OfferDetail, UpsertResult } from "../offers/types";

export interface OfferRepository {
  upsertMinedOffer(input: MinedOffer): Promise<UpsertResult>;
  patchOffer(slug: string, patch: OfferPatch): Promise<OfferDetail | null>;
  deleteOffer(slug: string): Promise<boolean>;
  listOffers(query: ListQuery): Promise<OfferDetail[]>;
}
