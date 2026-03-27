// index.js
require('dotenv').config();
const { createApp } = require('./src/app/server');
const { PORT } = require('./src/config');

const app = createApp();

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Fashion Price Comparison Server`);
  console.log(`   http://localhost:${PORT}`);
  console.log('='.repeat(50));
  console.log('\n📡 API 목록:');
  console.log('   POST /api/search          - 통합 상품 검색');
  console.log('   GET  /api/search/popular  - 인기 검색어');
  console.log('   POST /api/product/detail  - 상품 상세 크롤링');
  console.log('   GET  /api/wishlist        - 위시리스트 조회');
  console.log('   POST /api/wishlist        - 위시리스트 추가');
  console.log('   DELETE /api/wishlist/:id  - 위시리스트 삭제\n');
});
