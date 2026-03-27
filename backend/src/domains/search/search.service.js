// src/domains/search/search.service.js
const { searchNaverShopping } = require('../../integrations/naver');
const { groupProducts } = require('../product/product.matcher');
const { deduplicateByUrl, isTargetMall } = require('../../utils/mall');
const logger = require('../../utils/logger');

const POPULAR_SEARCHES = [
  '아디다스 삼바', '나이키 에어포스 1', '뉴발란스 530',
  '나이키 덩크 로우', '아디다스 가젤', '호카 클리프턴',
  '살로몬 XT-6', '온클라우드', '컨버스 척테일러',
];

async function searchProducts(keyword) {
  logger.info(`[Search] "${keyword}" 검색 시작`);
  const startTime = Date.now();

  try {
    // 1. 네이버 API 검색
    const rawItems = await searchNaverShopping(keyword);

    if (rawItems.length === 0) {
      return { keyword, totalCount: 0, masterProducts: [], elapsed: Date.now() - startTime };
    }

    // 2. 🌟 타겟 쇼핑몰만 필터링 (4910, ABLY 등 잡다한 쇼핑몰 제거)
    const targetItems = rawItems.filter(item => isTargetMall(item.mall));
    logger.info(`[Search] 타겟 필터링: ${rawItems.length}건 → ${targetItems.length}건`);

    // 3. 타겟 쇼핑몰 결과가 없으면 전체에서 가격 정보만 제공
    const itemsToProcess = targetItems.length > 0 ? targetItems : rawItems;

    // 4. 중복 URL 제거
    const deduplicated = deduplicateByUrl(itemsToProcess);

    // 5. 상품 그룹핑
    const masterProducts = groupProducts(deduplicated);

    // 6. 유의미한 결과 필터링 및 정렬
    const filtered = masterProducts
      .filter(mp => mp.lowestPrice != null)
      .sort((a, b) => {
        if (b.platformCount !== a.platformCount) return b.platformCount - a.platformCount;
        return (a.lowestPrice || 0) - (b.lowestPrice || 0);
      });

    const elapsed = Date.now() - startTime;
    logger.success(`[Search] 완료 (${elapsed}ms) - ${filtered.length}개 마스터 상품`);

    // 결과 로깅
    filtered.slice(0, 3).forEach(mp => {
      logger.info(`  📦 ${mp.name} (SKU: ${mp.sku || '없음'})`);
      mp.regularOffers.forEach(o => {
        logger.info(`     └─ ${o.mallLabel}: ${o.price?.toLocaleString()}원`);
      });
      if (mp.resellOffers.length > 0) {
        mp.resellOffers.forEach(o => {
          logger.info(`     └─ ${o.mallLabel} (리셀): ${o.price?.toLocaleString()}원~`);
        });
      }
    });

    return { keyword, totalCount: filtered.length, masterProducts: filtered, elapsed };

  } catch (err) {
    logger.error(`[Search] 오류: ${err.message}`);
    throw err;
  }
}

function getPopularSearches() {
  return POPULAR_SEARCHES;
}

module.exports = { searchProducts, getPopularSearches };
