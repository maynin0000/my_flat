// apps/mobile/src/types/product.ts

export interface ProductOffer {
  mall: string;
  mallLabel: string;
  price: number;
  url: string;
  isResell: boolean;
}

export interface MasterProduct {
  id: string; // SKU 혹은 naverProductId 기반
  name: string;
  brand: string | null;
  imageUrl: string | null;
  lowestPrice: number;
  platformCount: number;
  sku: string | null;
  regularOffers: ProductOffer[];
  resellOffers: ProductOffer[];
}

export interface SearchResponse {
  success: boolean;
  keyword: string;
  masterProducts: MasterProduct[];
  elapsed: number;
}