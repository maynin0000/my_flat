import type { ChangeType, TrackedListing } from "../types/trackedListing";

export function formatPrice(price: number | null): string {
  if (price == null) return "-";
  return `${price.toLocaleString("ko-KR")}원`;
}

export function getPriceChangeAmount(item: TrackedListing): number | null {
  if (item.currentPrice == null || item.previousPrice == null) return null;
  return item.previousPrice - item.currentPrice;
}

export function getPriceChangePercent(item: TrackedListing): number | null {
  if (item.currentPrice == null || item.previousPrice == null) return null;
  if (item.previousPrice <= 0) return null;

  const diff = item.previousPrice - item.currentPrice;
  return Math.round((diff / item.previousPrice) * 100);
}

export function getChangeType(item: TrackedListing): ChangeType {
  if (item.previousStatus === "sold_out" && item.currentStatus === "on_sale") {
    return "restocked";
  }

  if (item.currentStatus === "sold_out") {
    return "sold_out";
  }

  if (
    item.previousPrice != null &&
    item.currentPrice != null &&
    item.currentPrice < item.previousPrice
  ) {
    return "price_drop";
  }

  if (
    item.previousPrice != null &&
    item.currentPrice != null &&
    item.currentPrice > item.previousPrice
  ) {
    return "price_up";
  }

  return "unchanged";
}

export function getChangeLabel(item: TrackedListing): string {
  const changeType = getChangeType(item);

  switch (changeType) {
    case "restocked":
      return "재입고";
    case "price_drop":
      return "가격 하락";
    case "price_up":
      return "가격 상승";
    case "sold_out":
      return "품절";
    default:
      return "판매중";
  }
}

export function getChangeDisplay(item: TrackedListing): string {
  const amount = getPriceChangeAmount(item);
  const percent = getPriceChangePercent(item);

  if (amount == null || percent == null || amount === 0) {
    return "변동 없음";
  }

  const absAmount = Math.abs(amount).toLocaleString("ko-KR");
  const absPercent = Math.abs(percent);

  if (amount > 0) {
    return `▼${absAmount}원 (${absPercent}%)`;
  }

  return `▲${absAmount}원 (${absPercent}%)`;
}

export function getCouponPrice(
  price: number | null,
  discountPercent: number
): number | null {
  if (price == null) return null;
  return Math.floor(price * (1 - discountPercent / 100));
}

export function sortTrackedListings(items: TrackedListing[]): TrackedListing[] {
  const priorityMap: Record<ChangeType, number> = {
    restocked: 5,
    price_drop: 4,
    sold_out: 3,
    price_up: 2,
    unchanged: 1,
  };

  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    const aPriority = priorityMap[getChangeType(a)];
    const bPriority = priorityMap[getChangeType(b)];

    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }

    return (
      new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime()
    );
  });
}

export function filterTrackedListings(
  items: TrackedListing[],
  filter: "all" | "price_drop" | "restocked" | "sold_out",
  searchText: string
): TrackedListing[] {
  const lowered = searchText.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      !lowered || (item.name ?? "").toLowerCase().includes(lowered);

    if (!matchesSearch) return false;

    const changeType = getChangeType(item);

    switch (filter) {
      case "price_drop":
        return changeType === "price_drop";
      case "restocked":
        return changeType === "restocked";
      case "sold_out":
        return changeType === "sold_out";
      default:
        return true;
    }
  });
}