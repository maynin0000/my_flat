import type { TrackedListing } from "./trackedListing";

export type AddedOffer = {
  mall: "musinsa" | "kream" | "official" | "29cm";
  mallLabel: string;
  price: number;
  url: string;
};

// 기존 TrackedListing에 사이즈와 브랜드, 오퍼를 통합
export type TrackedItemWithOffers = TrackedListing & {
  brand?: string | null;
  targetSize?: string; // 🌟 새로 추가된 추적할 타겟 사이즈
  offers?: AddedOffer[];
};

export type RootStackParamList = {
  TrackedProducts: undefined;
  AddProduct: undefined;
  ProductDetail: {
    item: TrackedItemWithOffers; // any 제거됨!
  };
  ProductWebView: {
    url: string;
  };
};
