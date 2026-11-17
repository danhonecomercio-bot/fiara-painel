import type {
  FunnelModel,
  Opportunity,
  LanguageScan,
  ModelingCheck,
  OrderBump,
  ScoreBreakdownItem,
  OfferStatus,
  Upsell,
} from "./schema";

export type LibraryRow = {
  page_name: string;
  library_url: string;
  active_ads: number;
};

export type SnapshotRow = {
  captured_at: string;
  total_active_ads: number;
  per_library: LibraryRow[];
};

export type OfferDetail = {
  id: string;
  slug: string;
  title: string;
  niche: string | null;
  language_country: string | null;
  opportunity: Opportunity;
  opportunity_score: number | null;
  score_breakdown: ScoreBreakdownItem[] | null;
  opportunity_notes: string | null;
  google_library_url: string | null;
  expert: boolean;
  promise: string | null;
  front_ticket: string | null;
  funnel_model: FunnelModel | null;
  running_since: string | null;
  destination_urls: string[];
  checkout_url: string | null;
  order_bumps: OrderBump[];
  upsells: Upsell[];
  modeling_notes: string | null;
  language_scan: LanguageScan | null;
  modeling_check: ModelingCheck | null;
  raw: Record<string, unknown> | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
  libraries: LibraryRow[];
  snapshots: SnapshotRow[];
};

export type OfferCard = {
  id: string;
  slug: string;
  title: string;
  niche: string | null;
  language_country: string | null;
  opportunity: Opportunity;
  opportunity_score: number | null;
  modeling_opportunity: boolean;
  expert: boolean;
  promise: string | null;
  front_ticket: string | null;
  funnel_model: FunnelModel | null;
  status: OfferStatus;
  running_since: string | null;
  updated_at: string;
  created_at: string;
  is_example: boolean;
  total_active_ads: number | null;
  last_captured_at: string | null;
  prev_total_active_ads: number | null;
  prev_captured_at: string | null;
  library_names: string[];
};

export type UpsertResult = {
  id: string;
  slug: string;
  created: boolean;
  total_active_ads: number;
  snapshot_id: string;
};

export type ListQuery = {
  since?: string;
  limit: number;
  offset: number;
};
