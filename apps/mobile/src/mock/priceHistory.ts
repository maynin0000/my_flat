export type PriceHistoryPoint = {
  label: string;
  price: number;
};

export const mockPriceHistoryMap: Record<string, PriceHistoryPoint[]> = {
  "1": [
    { label: "2025/03/12", price: 89000 },
    { label: "2025/03/15", price: 88500 },
    { label: "2025/03/18", price: 87000 },
    { label: "2025/03/21", price: 86000 },
    { label: "2025/03/24", price: 85000 },
    { label: "2025/03/27", price: 83000 },
    { label: "2025/03/30", price: 81000 },
    { label: "2025/04/02", price: 79000 },
  ],

  "2": [
    { label: "2025/03/12", price: 145000 },
    { label: "2025/03/15", price: 144000 },
    { label: "2025/03/18", price: 143000 },
    { label: "2025/03/21", price: 142000 },
    { label: "2025/03/24", price: 141000 },
    { label: "2025/03/27", price: 140000 },
    { label: "2025/03/30", price: 139500 },
    { label: "2025/04/02", price: 139000 },
  ],

  "3": [
    { label: "2025/03/12", price: 119000 },
    { label: "2025/03/15", price: 120000 },
    { label: "2025/03/18", price: 121000 },
    { label: "2025/03/21", price: 123000 },
    { label: "2025/03/24", price: 125000 },
    { label: "2025/03/27", price: 127000 },
    { label: "2025/03/30", price: 128000 },
    { label: "2025/04/02", price: 129000 },
  ],
};