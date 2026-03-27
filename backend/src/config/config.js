// config.js
module.exports = {
  PORT: 3000,

  // 네이버 쇼핑 API
  NAVER: {
    CLIENT_ID: 'Wj3fxqcJIyDtODQtSBGT',
    CLIENT_SECRET: 'FmzdKfk2y5',
    DISPLAY: 40, // 한 번에 가져올 결과 수
  },

  // Puppeteer
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

  // 유사도 기준점
  SIMILARITY: {
    MIN_SCORE: 0.25,    // 이 점수 미만은 검색 결과에서 제외
    HIGH_SCORE: 0.6,    // 이 점수 이상은 "정확한 매칭"으로 판단
  },
};
