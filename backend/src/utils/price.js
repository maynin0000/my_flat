// src/utils/price.js

/**
 * 텍스트에서 가격 숫자 추출
 * "129,000원" → 129000
 */
function extractPrice(text) {
  if (text == null) return null;
  const cleaned = String(text).replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) && n >= 1000 && n <= 10000000 ? n : null;
}

/**
 * 숫자를 한국 원화 포맷으로
 * 129000 → "129,000원"
 */
function formatPrice(price) {
  if (price == null) return null;
  return `${price.toLocaleString('ko-KR')}원`;
}

/**
 * 여러 가격 중 최저가 반환
 */
function getLowestPrice(prices) {
  const valid = prices.filter(p => p != null && p > 0);
  return valid.length > 0 ? Math.min(...valid) : null;
}

/**
 * 쿠폰 적용가 계산 (최대 한도 반영)
 */
function getDiscountedPrice(price, couponPercent, maxLimit = null) {
  if (price == null) return null;
  if (!couponPercent || couponPercent <= 0) return price;
  let discount = price * (couponPercent / 100);
  if (maxLimit != null && discount > maxLimit) discount = maxLimit;
  return Math.floor(price - discount);
}

module.exports = { extractPrice, formatPrice, getLowestPrice, getDiscountedPrice };
