export type CompareSite = "musinsa" | "29cm" | "kream" | "official";

export type ComparePriceItem = {
  site: CompareSite;
  siteLabel: string;
  price: number | null;

  // 사용자가 쿠폰을 직접 입력할 수 있는 사이트인지
  supportsCoupon: boolean;

  // 기본 안내 문구
  couponText: string | null;

  url: string;
};

export const mockCompareMap: Record<string, ComparePriceItem[]> = {
  "1": [
    {
      site: "musinsa",
      siteLabel: "무신사",
      price: 79000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.musinsa.com/",
    },
    {
      site: "29cm",
      siteLabel: "29CM",
      price: 82000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.29cm.co.kr/",
    },
    {
      site: "kream",
      siteLabel: "크림",
      price: 76000,
      supportsCoupon: false,
      couponText: "쿠폰 없음",
      url: "https://kream.co.kr/",
    },
    {
      site: "official",
      siteLabel: "공식몰",
      price: 84000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.nike.com/kr/",
    },
  ],

  "2": [
    {
      site: "musinsa",
      siteLabel: "무신사",
      price: 139000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.musinsa.com/",
    },
    {
      site: "29cm",
      siteLabel: "29CM",
      price: 142000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.29cm.co.kr/",
    },
    {
      site: "kream",
      siteLabel: "크림",
      price: 136000,
      supportsCoupon: false,
      couponText: "쿠폰 없음",
      url: "https://kream.co.kr/",
    },
    {
      site: "official",
      siteLabel: "공식몰",
      price: 145000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.adidas.co.kr/",
    },
  ],

  "3": [
    {
      site: "musinsa",
      siteLabel: "무신사",
      price: 129000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.musinsa.com/",
    },
    {
      site: "29cm",
      siteLabel: "29CM",
      price: 131000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.29cm.co.kr/",
    },
    {
      site: "kream",
      siteLabel: "크림",
      price: 125000,
      supportsCoupon: false,
      couponText: "쿠폰 없음",
      url: "https://kream.co.kr/",
    },
    {
      site: "official",
      siteLabel: "공식몰",
      price: 134000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.nike.com/kr/",
    },
  ],

  "4": [
    {
      site: "musinsa",
      siteLabel: "무신사",
      price: 119000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.musinsa.com/",
    },
    {
      site: "29cm",
      siteLabel: "29CM",
      price: 121000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.29cm.co.kr/",
    },
    {
      site: "kream",
      siteLabel: "크림",
      price: 117000,
      supportsCoupon: false,
      couponText: "쿠폰 없음",
      url: "https://kream.co.kr/",
    },
    {
      site: "official",
      siteLabel: "공식몰",
      price: 123000,
      supportsCoupon: true,
      couponText: "쿠폰 입력 가능",
      url: "https://www.newbalance.co.kr/",
    },
  ],
};