// apps/mobile/src/shared/api/search.ts
import { SearchResponse } from '../../types/product';
import { apiFetch } from './client';

export const searchApi = {
  // 통합 검색
  searchProducts: (keyword: string) => 
    apiFetch<SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify({ keyword }),
    }),

  // 인기 검색어 (필요시)
  getPopular: () => 
    apiFetch<{ success: boolean; keywords: string[] }>('/search/popular'),
};