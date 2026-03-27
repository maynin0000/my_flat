// src/domains/product/product.matcher.js
const logger = require('../../utils/logger');

// ── 브랜드 표준화 사전 ──
const BRAND_NORMALIZE_MAP = {
  '아디다스': 'adidas', 'adidas': 'adidas',
  '나이키': 'nike', 'nike': 'nike',
  '뉴발란스': 'new-balance', 'new balance': 'new-balance', 'nb': 'new-balance',
  '컨버스': 'converse', 'converse': 'converse',
  '반스': 'vans', 'vans': 'vans',
  '살로몬': 'salomon', 'salomon': 'salomon',
  '호카': 'hoka', 'hoka': 'hoka', 'hoka one one': 'hoka',
  '온': 'on-running', 'on running': 'on-running', 'on': 'on-running',
  '아식스': 'asics', 'asics': 'asics',
  '푸마': 'puma', 'puma': 'puma',
  '리복': 'reebok', 'reebok': 'reebok',
  '스케쳐스': 'skechers', 'skechers': 'skechers',
};

// ── 제거할 노이즈 단어 ──
const NOISE_WORDS = [
  '스니커즈', '운동화', '신발', '슈즈', '로우', '하이', '미드',
  'shoes', 'sneakers', 'low', 'high', 'mid',
  '남성', '여성', '남', '여', '공용', '유니섹스',
  'men', 'women', 'unisex', 'mens', 'womens',
  '정품', '공식', '국내', '한국',
  'official', 'authentic', 'korea',
];

// ── SKU 패턴 ──
const SKU_PATTERNS = [
  /\b[A-Z]{1,3}[0-9]{4,6}(?:-[0-9]{3})?\b/g, // B75806, CW2288-111
  /\b[A-Z][A-Z0-9]{5,11}\b/g,                  // GY3489, FX5502
];

// ── 색상 표준화 ──
const COLOR_MAP = {
  '화이트': 'white', 'white': 'white', '흰색': 'white',
  '블랙': 'black', 'black': 'black', '검정': 'black',
  '그레이': 'gray', 'gray': 'gray', 'grey': 'gray', '회색': 'gray',
  '네이비': 'navy', 'navy': 'navy',
  '베이지': 'beige', 'beige': 'beige',
  '크림': 'cream', 'cream': 'cream',
  '레드': 'red', 'red': 'red', '빨강': 'red',
  '블루': 'blue', 'blue': 'blue', '파랑': 'blue',
  '그린': 'green', 'green': 'green', '초록': 'green',
  '핑크': 'pink', 'pink': 'pink',
  '오렌지': 'orange', 'orange': 'orange',
  '퍼플': 'purple', 'purple': 'purple',
  '브라운': 'brown', 'brown': 'brown',
  '옐로우': 'yellow', 'yellow': 'yellow', '노랑': 'yellow',
};

// ==========================================
// 파싱 함수들
// ==========================================

function extractSKU(name) {
  const upper = (name || '').toUpperCase();
  const results = [];
  for (const pattern of SKU_PATTERNS) {
    const matches = upper.match(pattern) || [];
    results.push(...matches);
  }
  // 가장 명확한 SKU 패턴 우선
  return results.length > 0 ? results[0] : null;
}

function normalizeBrand(name) {
  const lower = (name || '').toLowerCase();
  for (const [key, value] of Object.entries(BRAND_NORMALIZE_MAP)) {
    if (lower.includes(key.toLowerCase())) return value;
  }
  return null;
}

function extractColor(name) {
  const lower = (name || '').toLowerCase();
  const foundColors = [];
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      if (!foundColors.includes(value)) foundColors.push(value);
    }
  }
  return foundColors.length > 0 ? foundColors.sort().join('+') : null;
}

function normalizeModelName(name) {
  let normalized = (name || '').toLowerCase();

  // 브랜드명 제거
  for (const key of Object.keys(BRAND_NORMALIZE_MAP)) {
    normalized = normalized.replace(new RegExp(key.toLowerCase(), 'g'), '');
  }

  // 노이즈 단어 제거
  for (const word of NOISE_WORDS) {
    normalized = normalized.replace(new RegExp(`\\b${word.toLowerCase()}\\b`, 'g'), '');
  }

  // SKU 제거
  for (const pattern of SKU_PATTERNS) {
    normalized = normalized.replace(pattern, '');
  }

  // 색상 제거
  for (const key of Object.keys(COLOR_MAP)) {
    normalized = normalized.replace(new RegExp(key.toLowerCase(), 'g'), '');
  }

  // 특수문자, 공백 정리
  normalized = normalized
    .replace(/[^a-z0-9가-힣\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * 상품 지문(Fingerprint) 생성
 * 매칭의 핵심 데이터
 */
function getFingerprint(item) {
  const name = item.name || '';
  return {
    sku: extractSKU(name),
    brand: normalizeBrand(item.brand || name),
    modelName: normalizeModelName(name),
    color: extractColor(name),
    naverProductId: item.naverProductId || null,
  };
}

// ==========================================
// 유사도 계산
// ==========================================

function jaccardSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const wordsA = new Set(str1.split(/\s+/).filter(w => w.length > 0));
  const wordsB = new Set(str2.split(/\s+/).filter(w => w.length > 0));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.length / union.size;
}

// ==========================================
// 핵심: 두 상품이 같은 상품인지 판별
// ==========================================

/**
 * 1순위: SKU 매칭
 * 2순위: 브랜드 + 모델명 + 색상 매칭
 * 3순위: 텍스트 유사도
 * 4순위: 이미지 유사도 (현재는 URL 패턴으로 대체)
 */
function isSameProduct(a, b) {
  const fpA = getFingerprint(a);
  const fpB = getFingerprint(b);

  // ── 1순위: 네이버 productId 일치 ──
  if (fpA.naverProductId && fpB.naverProductId) {
    if (fpA.naverProductId === fpB.naverProductId) {
      return { isSame: true, confidence: 1.0, reason: 'naver_product_id' };
    }
  }

  // ── 1순위: SKU 일치 ──
  if (fpA.sku && fpB.sku) {
    if (fpA.sku === fpB.sku) {
      return { isSame: true, confidence: 0.98, reason: 'sku' };
    }
    // SKU가 둘 다 있는데 다르면 → 다른 상품
    return { isSame: false, confidence: 0, reason: 'sku_mismatch' };
  }

  // ── 2순위: 브랜드 + 모델명 + 색상 ──
  if (fpA.brand && fpB.brand) {
    if (fpA.brand !== fpB.brand) {
      // 브랜드가 다르면 무조건 다른 상품
      return { isSame: false, confidence: 0, reason: 'brand_mismatch' };
    }

    // 브랜드 일치 → 모델명 유사도 계산
    const modelSimilarity = jaccardSimilarity(fpA.modelName, fpB.modelName);

    if (modelSimilarity >= 0.7) {
      // 모델명 유사 → 색상도 같은지 확인
      const colorMatch = !fpA.color || !fpB.color || fpA.color === fpB.color;
      const confidence = colorMatch ? modelSimilarity * 0.9 : modelSimilarity * 0.5;
      const isSame = colorMatch && modelSimilarity >= 0.7;

      return {
        isSame,
        confidence,
        reason: 'brand_model_color',
        detail: { brand: fpA.brand, modelSimilarity, colorMatch },
      };
    }
  }

  // ── 3순위: 텍스트 유사도 (전체 상품명 기준) ──
  const rawSimilarity = jaccardSimilarity(
    normalizeModelName(a.name || ''),
    normalizeModelName(b.name || '')
  );

  if (rawSimilarity >= 0.75) {
    return {
      isSame: true,
      confidence: rawSimilarity * 0.7,
      reason: 'text_similarity',
      detail: { similarity: rawSimilarity },
    };
  }

  return { isSame: false, confidence: 0, reason: 'no_match' };
}

// ==========================================
// 여러 상품을 같은 상품끼리 그룹핑
// ==========================================

/**
 * 여러 플랫폼의 상품들을 같은 상품끼리 묶음
 * 결과: MasterProduct 배열
 */
function groupProducts(items) {
  const groups = [];
  const assigned = new Set();

  items.forEach((item, i) => {
    if (assigned.has(i)) return;

    // 새 그룹 시작
    const group = {
      platforms: [{ ...item, matchConfidence: 1.0, matchReason: 'base' }],
    };

    // 나머지 상품과 비교
    items.forEach((other, j) => {
      if (i === j || assigned.has(j)) return;

      const result = isSameProduct(item, other);
      if (result.isSame && result.confidence >= 0.5) {
        group.platforms.push({
          ...other,
          matchConfidence: result.confidence,
          matchReason: result.reason,
        });
        assigned.add(j);
      }
    });

    assigned.add(i);
    groups.push(group);
  });

  // 각 그룹을 MasterProduct 형태로 변환
  return groups.map(group => buildMasterProduct(group.platforms));
}

/**
 * 플랫폼 목록에서 MasterProduct 생성
 */
function buildMasterProduct(platforms) {
  // 신뢰도 높은 소스에서 대표 정보 추출
  const primarySource = platforms.find(p => p.naverProductId) || platforms[0];

  // 가격 있는 상품들만
  const withPrice = platforms.filter(p => p.price != null && p.price > 0);
  const lowestPriceItem = withPrice.sort((a, b) => a.price - b.price)[0] || null;
  const lowestPrice = lowestPriceItem?.price || null;

  // 일반몰 vs 리셀 분리
  const regularOffers = platforms.filter(p => !p.isResell);
  const resellOffers = platforms.filter(p => p.isResell);

  const regularLowest = regularOffers
    .filter(p => p.price)
    .sort((a, b) => a.price - b.price)[0] || null;

  return {
    // 식별자
    id: `mp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,

    // 대표 정보
    name: primarySource.name,
    brand: normalizeBrand(primarySource.brand || primarySource.name),
    brandLabel: primarySource.brand || null,
    sku: extractSKU(primarySource.name),
    color: extractColor(primarySource.name),
    imageUrl: primarySource.imageUrl || null,

    // 가격 요약
    lowestPrice,
    lowestMall: lowestPriceItem?.mallLabel || null,
    regularLowestPrice: regularLowest?.price || null,
    regularLowestMall: regularLowest?.mallLabel || null,

    // 플랫폼별 상세 (MallOffer 배열)
    offers: platforms.map(p => ({
      mall: p.mall,
      mallLabel: p.mallLabel,
      price: p.price,
      url: p.url,
      isResell: p.isResell || false,
      imageUrl: p.imageUrl || null,
      naverProductId: p.naverProductId || null,
      // 사이즈 재고 (크롤링 후 채워짐)
      sizeStock: null,
    })),

    // 분리된 오퍼
    regularOffers: regularOffers.map(p => ({
      mall: p.mall,
      mallLabel: p.mallLabel,
      price: p.price,
      url: p.url,
      isResell: false,
      sizeStock: null,
    })),

    resellOffers: resellOffers.map(p => ({
      mall: p.mall,
      mallLabel: p.mallLabel,
      price: p.price,
      url: p.url,
      isResell: true,
      sizeStock: null,
      priceNote: '즉시구매가 · 검수비 별도 · 사이즈별 상이',
    })),

    // 매칭 메타
    matchConfidence: platforms[0]?.matchConfidence || 1.0,
    matchReason: platforms[0]?.matchReason || 'base',
    platformCount: platforms.length,
  };
}

module.exports = {
  groupProducts,
  isSameProduct,
  getFingerprint,
  extractSKU,
  normalizeBrand,
  extractColor,
};
