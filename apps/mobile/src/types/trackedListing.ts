export type SiteType = "musinsa";

export type ProductStatus = "on_sale" | "sold_out" | "ended" | "unknown";

export type StockStatus = "in_stock" | "sold_out" | "unknown";

export type ChangeType =
  | "restocked"
  | "price_drop"
  | "price_up"
  | "sold_out"
  | "unchanged";

export type TrackedListing = {
  id: string;

  site: SiteType;
  url: string;

  name: string | null;
  imageUrl: string | null;

  currentPrice: number | null;
  previousPrice: number | null;

  currentStatus: ProductStatus;
  previousStatus: ProductStatus | null;

  sizes: Record<string, StockStatus>;

  isPinned: boolean;

  createdAt: string;
  lastCheckedAt: string;
};