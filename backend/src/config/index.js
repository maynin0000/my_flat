// src/config/index.js
module.exports = {
  PORT: process.env.PORT || 3000,

  NAVER: {
    CLIENT_ID: process.env.NAVER_CLIENT_ID || '',
    CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET || '',
    DISPLAY: 40,
    TIMEOUT: 10000,
  },

  BROWSER: {
    ARGS: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--lang=ko-KR',
    ],
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    TIMEOUT: 20000,
  },

  MATCHER: {
    SKU_CONFIDENCE: 1.0,
    BRAND_MODEL_CONFIDENCE: 0.85,
    TEXT_CONFIDENCE_THRESHOLD: 0.65,
    MIN_DISPLAY_CONFIDENCE: 0.5,
  },

  MALLS: {
    musinsa: { label: '무신사', isResell: false, supportsCoupon: true },
    '29cm': { label: '29CM', isResell: false, supportsCoupon: true },
    kream: { label: '크림', isResell: true, supportsCoupon: false },
    soldout: { label: '솔드아웃', isResell: true, supportsCoupon: false },
    nike: { label: '나이키 공식', isResell: false, supportsCoupon: true },
    adidas: { label: '아디다스 공식', isResell: false, supportsCoupon: true },
    newbalance: { label: '뉴발란스 공식', isResell: false, supportsCoupon: true },
    official: { label: '공식몰', isResell: false, supportsCoupon: true },
  },
};
