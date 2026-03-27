// apps/mobile/src/shared/theme.ts

export const theme = {
  colors: {
    // 브랜드 메인 컬러
    primary: '#000000',      // 강조색 (주로 블랙)
    secondary: '#007AFF',    // 포인트색 (링크, 리셀 배지 등)
    
    // 배경 및 표면
    background: '#F8F8F8',
    surface: '#FFFFFF',
    
    // 텍스트 컬러
    textPrimary: '#111111',
    textSecondary: '#666666',
    textTertiary: '#999999',
    
    // 상태 및 액션
    error: '#FF4D4F',
    success: '#52C41A',
    resellBadge: '#F0F9FF',  // 크림/솔드아웃 강조용 연한 블루
    
    // 보더
    border: '#EEEEEE',
  },

  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },

  fontSize: {
    tiny: 10,
    caption: 12,
    body: 14,
    subTitle: 16,
    title: 18,
    header: 22,
  },

  borderRadius: {
    s: 4,
    m: 8,
    l: 12,
    round: 999,
  }
};

export type Theme = typeof theme;