// src/integrations/naver.js
const https = require('https');
const { NAVER } = require('../config');
const logger = require('../utils/logger');

/**
 * 네이버 쇼핑 API 호출 (UTF-8 인코딩 완벽 처리)
 */
function callNaverShoppingAPI(keyword, display = NAVER.DISPLAY) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(keyword);
    const path = `/v1/search/shop.json?query=${query}&display=${display}&sort=sim`;

    if (!NAVER.CLIENT_ID || !NAVER.CLIENT_SECRET) {
      reject(new Error('네이버 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.'));
      return;
    }

    const options = {
      hostname: 'openapi.naver.com',
      path,
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': NAVER.CLIENT_ID,
        'X-Naver-Client-Secret': NAVER.CLIENT_SECRET,
        'Accept': 'application/json; charset=utf-8',
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          // Buffer로 받아서 UTF-8 디코딩 (한글 깨짐 완벽 방지)
          const raw = Buffer.concat(chunks).toString('utf8');
          const parsed = JSON.parse(raw);

          if (parsed.errorCode) {
            reject(new Error(`네이버 API 오류: ${parsed.errorMessage} (${parsed.errorCode})`));
            return;
          }

          resolve(parsed);
        } catch (e) {
          reject(new Error(`응답 파싱 실패: ${e.message}`));
        }
      });
    });

    req.setTimeout(NAVER.TIMEOUT, () => {
      req.destroy();
      reject(new Error('네이버 API 타임아웃'));
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 네이버 쇼핑 검색 결과를 우리 포맷으로 변환
 */
function formatNaverItems(items, keyword) {
  const { stripHtml, detectMall } = require('../utils/mall');
  const { extractPrice } = require('../utils/price');

  return items.map(item => {
    const name = stripHtml(item.title || '');
    const { mall, mallLabel, isResell } = detectMall(item.link, item.mallName);

    return {
      // 원본 정보
      name,
      brand: item.brand ? stripHtml(item.brand) : null,
      category: item.category1 || null,
      imageUrl: item.image || null,

      // 가격
      price: extractPrice(String(item.lprice || '')),
      originalPrice: extractPrice(String(item.hprice || '')),

      // 쇼핑몰 정보
      mall,
      mallLabel: item.mallName || mallLabel,
      isResell,
      url: item.link || '',

      // 네이버 고유 ID (같은 상품 그룹핑에 활용)
      naverProductId: item.productId || null,

      // 메타
      source: 'naver',
    };
  });
}

/**
 * 키워드로 네이버 쇼핑 검색
 */
async function searchNaverShopping(keyword) {
  logger.info(`[Naver API] "${keyword}" 검색 중...`);

  const result = await callNaverShoppingAPI(keyword);
  const items = result.items || [];
  const formatted = formatNaverItems(items, keyword);

  logger.success(`[Naver API] ${formatted.length}건 수신`);
  return formatted;
}

module.exports = { searchNaverShopping };
