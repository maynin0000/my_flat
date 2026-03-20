import React, { createContext, useContext, useState } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage"; // 앱 런칭 시 이 주석을 푸세요!
import { mockTrackedListings } from "../mock/trackedListings";
import type { TrackedItemWithOffers } from "../types/navigation";

type TrackedItemsContextType = {
  items: TrackedItemWithOffers[];
  addItem: (item: TrackedItemWithOffers) => void;
  toggleFavorite: (id: string) => void;
};

const TrackedItemsContext = createContext<TrackedItemsContextType | null>(null);

export function TrackedItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<TrackedItemWithOffers[]>(mockTrackedListings as TrackedItemWithOffers[]);

  // useEffect(() => {
  //   AsyncStorage.getItem("@tracked_items").then((data) => {
  //     if (data) setItems(JSON.parse(data));
  //   });
  // }, []);

  // useEffect(() => {
  //   AsyncStorage.setItem("@tracked_items", JSON.stringify(items));
  // }, [items]);

  const addItem = (item: TrackedItemWithOffers) => {
    setItems((prev) => {
      if (prev.some((p) => p.name === item.name)) return prev;
      return [item, ...prev];
    });
  };

  const toggleFavorite = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPinned: !item.isPinned } : item))
    );
  };

  return (
    <TrackedItemsContext.Provider value={{ items, addItem, toggleFavorite }}>
      {children}
    </TrackedItemsContext.Provider>
  );
}

export function useTrackedItems() {
  const context = useContext(TrackedItemsContext);
  if (!context) throw new Error("Provider 밖에서 호출되었습니다.");
  return context;
}
