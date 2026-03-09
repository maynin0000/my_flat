import type { TrackedListing } from "../types/trackedListing";

export const mockTrackedListings: TrackedListing[] = [
  {
    id: "1",
    site: "musinsa",
    url: "https://www.musinsa.com/app/goods/111111",
    name: "무신사 스탠다드 릴렉스 핏 후디",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    currentPrice: 79000,
    previousPrice: 89000,
    currentStatus: "on_sale",
    previousStatus: "on_sale",
    sizes: {
      M: "sold_out",
      L: "in_stock",
      XL: "in_stock",
    },
    isPinned: true,
    createdAt: "2026-03-01T09:00:00.000Z",
    lastCheckedAt: "2026-03-09T09:12:00.000Z",
  },
  {
    id: "2",
    site: "musinsa",
    url: "https://www.musinsa.com/app/goods/222222",
    name: "아디다스 삼바 OG",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    currentPrice: 139000,
    previousPrice: 139000,
    currentStatus: "on_sale",
    previousStatus: "sold_out",
    sizes: {
      260: "in_stock",
      270: "in_stock",
      280: "sold_out",
    },
    isPinned: false,
    createdAt: "2026-03-02T10:30:00.000Z",
    lastCheckedAt: "2026-03-09T09:08:00.000Z",
  },
  {
    id: "3",
    site: "musinsa",
    url: "https://www.musinsa.com/app/goods/333333",
    name: "나이키 에어포스 1 '07",
    imageUrl:
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=800&auto=format&fit=crop",
    currentPrice: 129000,
    previousPrice: 119000,
    currentStatus: "on_sale",
    previousStatus: "on_sale",
    sizes: {
      260: "in_stock",
      270: "in_stock",
      280: "in_stock",
    },
    isPinned: true,
    createdAt: "2026-03-03T11:00:00.000Z",
    lastCheckedAt: "2026-03-09T08:50:00.000Z",
  },
  {
    id: "4",
    site: "musinsa",
    url: "https://www.musinsa.com/app/goods/444444",
    name: "뉴발란스 530",
    imageUrl:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop",
    currentPrice: 119000,
    previousPrice: 119000,
    currentStatus: "sold_out",
    previousStatus: "on_sale",
    sizes: {
      260: "sold_out",
      270: "sold_out",
      280: "sold_out",
    },
    isPinned: false,
    createdAt: "2026-03-05T12:20:00.000Z",
    lastCheckedAt: "2026-03-09T08:20:00.000Z",
  },
];