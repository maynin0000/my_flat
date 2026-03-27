// apps/mobile/src/features/wishlist/closetcontext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MasterProduct } from '../../types/product';

const STORAGE_KEY = '@lookscanner_closet';

interface ClosetContextType {
  wishlist: MasterProduct[];
  toggleWishlist: (product: MasterProduct) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const ClosetContext = createContext<ClosetContextType | undefined>(undefined);

export const ClosetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<MasterProduct[]>([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setWishlist(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load wishlist', e);
    }
  };

  const toggleWishlist = async (product: MasterProduct) => {
    try {
      let newWishlist = [...wishlist];
      const index = newWishlist.findIndex((item) => item.id === product.id);

      if (index >= 0) {
        newWishlist.splice(index, 1);
      } else {
        newWishlist.push(product);
      }

      setWishlist(newWishlist);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newWishlist));
    } catch (e) {
      console.error('Failed to update wishlist', e);
    }
  };

  const isInWishlist = (productId: string) => wishlist.some((item) => item.id === productId);

  return (
    <ClosetContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </ClosetContext.Provider>
  );
};

export const useCloset = () => {
  const context = useContext(ClosetContext);
  if (!context) throw new Error('useCloset must be used within ClosetProvider');
  return context;
};