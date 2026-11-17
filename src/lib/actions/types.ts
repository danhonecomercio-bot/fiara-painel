export const OFFER_ACTIONS = ["baixar_top_ads", "modelar", "dissecar", "varredura_idiomas"] as const;
export const BUTTON_ACTIONS = ["baixar_top_ads", "modelar", "varredura_idiomas"] as const;
export const OFFER_ACTION_STATUSES = ["pending", "sent", "failed", "done"] as const;

export type OfferActionName = (typeof OFFER_ACTIONS)[number];
export type OfferActionStatus = (typeof OFFER_ACTION_STATUSES)[number];

export type OfferAction = {
  id: string;
  offer_id: string;
  action: OfferActionName;
  status: OfferActionStatus;
  requested_by: string;
  result_url: string | null;
  error: string | null;
  created_at: string;
};

export type ActionStore = {
  insert(action: OfferAction): Promise<void>;
  update(
    id: string,
    patch: Partial<Pick<OfferAction, "status" | "result_url" | "error">>,
  ): Promise<OfferAction | null>;
  get(id: string): Promise<OfferAction | null>;
  latestForOffer(offerId: string): Promise<OfferAction[]>;
  listForOffer(offerId: string): Promise<OfferAction[]>;
};
