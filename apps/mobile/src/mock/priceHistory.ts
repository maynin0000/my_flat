export type PriceHistoryPoint = {
  label: string;
  price: number;
};

export const mockPriceHistoryMap: Record<string, PriceHistoryPoint[]> = {
  "1": [
    { label: "1", price: 89000 },
    { label: "5", price: 87000 },
    { label: "10", price: 85000 },
    { label: "15", price: 83000 },
    { label: "20", price: 82000 },
    { label: "25", price: 80000 },
    { label: "30", price: 79000 },
  ],

  "2": [
    { label: "1", price: 145000 },
    { label: "5", price: 143000 },
    { label: "10", price: 142000 },
    { label: "15", price: 141000 },
    { label: "20", price: 140000 },
    { label: "25", price: 139500 },
    { label: "30", price: 139000 },
  ],

  "3": [
    { label: "1", price: 119000 },
    { label: "5", price: 120000 },
    { label: "10", price: 122000 },
    { label: "15", price: 125000 },
    { label: "20", price: 127000 },
    { label: "25", price: 128000 },
    { label: "30", price: 129000 },
  ],
};