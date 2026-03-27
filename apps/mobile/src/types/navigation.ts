// apps/mobile/src/types/navigation.ts
import { MasterProduct } from './product';

export type RootStackParamList = {
  MainTabs: undefined;
  ProductDetail: {
    product: MasterProduct;
  };
};

export type TabParamList = {
  SearchTab: undefined;
  ClosetTab: undefined;
};