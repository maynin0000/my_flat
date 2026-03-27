const express = require('express');
const cors = require('cors');
const https = require('https');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());

// 🌟 인코딩 강화 미들웨어
app.use((req, res, next) => {
  req.setEncoding('utf8');
  next();
});

app.use(express.json({
  type: ['application/json', 'application/json; charset=utf-8', 'text/plain'],
}));

// 🌟 모든 응답에 UTF-8 강제
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});


const PORT = 3000;

const NAVER_CLIENT_ID = 'Wj3fxqcJIyDtODQtSBGT';
const NAVER_CLIENT_SECRET = 'FmzdKfk2y5';

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--lang=ko-KR',
  '--accept-lang=ko-KR,ko',
];

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ==========================================
// 유틸 함수
// ==========================================
function stripHtml(str) {
  return str ? str.replace(/<[^>]+>/g, '').trim() : '';
}

function extractPrice(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) && n >= 1000 && n <= 10000000 ? n : null;
}

function getSimilarityScore(keyword, productName) {
  if (!keyword || !productName) return 0;
  const normalize = (s) => s
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const a = normalize(keyword);
  const b = normalize(productName);
  if (b.includes(a) || a.includes(b)) return 0.95;
  const wordsA = new Set(a.split(' ').filter(w => w.length > 0));
  const wordsB = new Set(b.split(' ').filter(w => w.length > 0));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.length / union.size;
}

function detectMallFromUrl(url, mallName) {
  const lowerUrl = (url || '').toLowerCase();
  const lowerMall = (mallName || '').toLowerCase();

  if (lowerUrl.includes('musinsa.com') || lowerMall.includes('무신사')) {
    return { mall: 'musinsa', mallLabel: '무신사' };
  }
  if (lowerUrl.includes('29cm.co.kr') || lowerMall.includes('29cm')) {
    return { mall: '29cm', mallLabel: '29CM' };
  }
  if (lowerUrl.includes('kream.co.kr') || lowerMall.includes('kream') || lowerMall.includes('크림')) {
    return { mall: 'kream', mallLabel: '크림' };
  }
  if (lowerUrl.includes('nike.com') || lowerMall.includes('나이키')) {
    return { mall: 'official', mallLabel: '나이키 공식' };
  }
  if (lowerUrl.includes('adidas.co.kr') || lowerMall.includes('아디다스')) {
    return { mall: 'official', mallLabel: '아디다스 공식' };
  }
  if (lowerUrl.includes('newbalance.co.kr') || lowerMall.includes('뉴발란스')) {
    return { mall: 'official', mallLabel: '뉴발란스 공식' };
  }
  if (lowerUrl.includes('wconcept') || lowerMall.includes('wconcept')) {
    return { mall: 'official', mallLabel: 'W컨셉' };
  }

  return { mall: 'official', mallLabel: mallName || '공식몰' };
}

// 중복 상품 제거 (URL 기준)
function deduplicateByUrl(items) {
  const seen = new Set();
  return items.filter(item => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

// ==========================================
// 소스 1: 네이버 쇼핑 API
// ==========================================
function fetchNaverShopping(keyword, display = 40) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(keyword);
    const options = {
      hostname: 'openapi.naver.com',
      path: `/v1/search/shop.json?query=${query}&display=${display}&sort=sim`,
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('네이버 API 파싱 실패')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function formatNaverItem(item, keyword) {
  const name = stripHtml(item.title);
  const { mall, mallLabel } = detectMallFromUrl(item.link, item.mallName);
  return {
    source: 'naver',
    mall,
    mallLabel: item.mallName || mallLabel,
    name,
    price: extractPrice(String(item.lprice || '')),
    imageUrl: item.image || null,
    url: item.link || '',
    similarityScore: getSimilarityScore(keyword, name),
    brand: item.brand ? stripHtml(item.brand) : null,
  };
}

// ==========================================
// 소스 2: Google 쇼핑 스크래핑
// ==========================================
async function fetchGoogleShopping(keyword, browser) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(DESKTOP_UA);
    await page.setViewport({ width: 1280, height: 800 });

    // Google 쇼핑 탭으로 직접 접근
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=shop&hl=ko&gl=kr`;
    console.log(`  [Google] 검색: "${keyword}"`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    const results = await page.evaluate(() => {
      const items = [];

      // Google 쇼핑 상품 카드 셀렉터 (여러 패턴 시도)
      const selectors = [
        '.sh-dgr__content',
        '.sh-pr__product-results-grid .sh-dgr__gr-auto',
        '[data-hveid] .sh-dgr__content',
        '.i0X6df',
        '.Lq5OHe',
      ];

      let cards = [];
      for (const sel of selectors) {
        cards = Array.from(document.querySelectorAll(sel));
        if (cards.length > 0) break;
      }

      // 카드가 안 잡히면 링크 기반으로 fallback
      if (cards.length === 0) {
        const shoppingLinks = Array.from(
          document.querySelectorAll('a[href*="shopping"], a[data-ved]')
        ).filter(a => {
          const text = a.textContent.trim();
          return text.length > 5 && text.length < 100;
        }).slice(0, 15);

        shoppingLinks.forEach(link => {
          const parent = link.closest('[data-hveid]') || link.parentElement;
          if (!parent) return;
          const priceEl = parent.querySelector('[aria-label*="원"], .a8Pemb, .OFFNJ');
          const storeEl = parent.querySelector('.aULzUe, .E5ocAb, .LbUacb');
          items.push({
            name: link.textContent.trim(),
            priceText: priceEl ? priceEl.textContent.trim() : null,
            href: link.getAttribute('href'),
            store: storeEl ? storeEl.textContent.trim() : null,
          });
        });

        return items.slice(0, 15);
      }

      cards.slice(0, 20).forEach(card => {
        // 상품명
        const nameEl = card.querySelector(
          'h3, .tAxDx, [class*="title"], [class*="name"], .rgHvZc'
        );
        // 가격
        const priceEl = card.querySelector(
          '.a8Pemb, .OFFNJ, [class*="price"], [aria-label*="원"]'
        );
        // 판매처
        const storeEl = card.querySelector(
          '.aULzUe, .E5ocAb, .LbUacb, [class*="merchant"], [class*="store"]'
        );
        // 링크
        const linkEl = card.querySelector('a[href]');
        // 이미지
        const imgEl = card.querySelector('img');

        const name = nameEl ? nameEl.textContent.trim() : null;
        const priceText = priceEl ? priceEl.textContent.trim() : null;
        const store = storeEl ? storeEl.textContent.trim() : null;
        const href = linkEl ? linkEl.getAttribute('href') : null;
        const imgSrc = imgEl ? imgEl.getAttribute('src') : null;

        if (name && name.length > 2) {
          items.push({ name, priceText, store, href, imgSrc });
        }
      });

      return items;
    });

    console.log(`  [Google] ${results.length}건 발견`);

    // URL 정제 (Google 리다이렉트 URL 처리)
    return results.map(item => {
      let cleanUrl = item.href || '';

      // Google 리다이렉트 URL 파싱
      if (cleanUrl.startsWith('/url?q=')) {
        cleanUrl = decodeURIComponent(cleanUrl.slice(7).split('&')[0]);
      } else if (cleanUrl.startsWith('/shopping/product')) {
        cleanUrl = `https://www.google.com${cleanUrl}`;
      }

      const { mall, mallLabel } = detectMallFromUrl(cleanUrl, item.store);

      return {
        source: 'google',
        mall,
        mallLabel: item.store || mallLabel,
        name: item.name,
        price: extractPrice(item.priceText),
        imageUrl: item.imgSrc || null,
        url: cleanUrl,
        similarityScore: 0, // 나중에 계산
        brand: null,
      };
    });

  } catch (err) {
    console.error(`  [Google 에러]`, err.message);
    return [];
  } finally {
    await page.close();
  }
}

// ==========================================
// 최저가 비교
// ==========================================
function buildPriceComparison(items) {
  const withPrice = items.filter(i => i.price != null && i.price > 0);
  if (withPrice.length < 2) return null;
  const sorted = [...withPrice].sort((a, b) => a.price - b.price);
  return {
    lowestItem: sorted[0],
    highestItem: sorted[sorted.length - 1],
    priceDiff: sorted[sorted.length - 1].price - sorted[0].price,
    savingRate: sorted[sorted.length - 1].price > 0
      ? Math.round(((sorted[sorted.length - 1].price - sorted[0].price) / sorted[sorted.length - 1].price) * 100)
      : 0,
    allPrices: sorted.map(i => ({
      mallLabel: i.mallLabel,
      price: i.price,
      url: i.url,
      source: i.source,
    })),
  };
}

// ==========================================
// 🌟 API 1: 검색 (네이버 + Google 하이브리드)
// ==========================================
app.post('/api/search', async (req, res) => {
  const keyword = req.body?.keyword ? String(req.body.keyword).trim() : '';
  if (!keyword) return res.status(400).json({ error: '검색어를 입력해주세요.' });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`[검색 시작] "${keyword}"`);
  console.log(`${'='.repeat(50)}`);

  let browser;
  try {
    // ── 소스 1: 네이버 쇼핑 API ──
    let naverItems = [];
    try {
      const naverResult = await fetchNaverShopping(keyword, 40);
      if (!naverResult.errorCode) {
        naverItems = (naverResult.items || [])
          .map(item => formatNaverItem(item, keyword))
          .filter(item => item.similarityScore >= 0.2);
        console.log(`[네이버] ${naverItems.length}건 (유사도 0.2 이상)`);
      } else {
        console.warn(`[네이버 API 에러] ${naverResult.errorMessage}`);
      }
    } catch (err) {
      console.warn(`[네이버 실패] ${err.message}`);
    }

    // ── 소스 2: Google 쇼핑 스크래핑 ──
    let googleItems = [];
    try {
      browser = await puppeteer.launch({ headless: "new", args: BROWSER_ARGS });
      const rawGoogle = await fetchGoogleShopping(keyword, browser);
      await browser.close();
      browser = null;

      googleItems = rawGoogle
        .map(item => ({
          ...item,
          similarityScore: getSimilarityScore(keyword, item.name || ''),
        }))
        .filter(item => item.similarityScore >= 0.2);

      console.log(`[Google] ${googleItems.length}건 (유사도 0.2 이상)`);
    } catch (err) {
      console.warn(`[Google 실패] ${err.message}`);
      if (browser) { await browser.close(); browser = null; }
    }

    // ── 통합 및 중복 제거 ──
    // 네이버를 우선하되, Google에만 있는 결과 추가
    const naverUrls = new Set(naverItems.map(i => i.url));
    const googleOnly = googleItems.filter(i => !naverUrls.has(i.url));

    const allItems = deduplicateByUrl([...naverItems, ...googleOnly])
      .sort((a, b) => b.similarityScore - a.similarityScore);

    console.log(`[통합] 총 ${allItems.length}건 (네이버:${naverItems.length} + Google 전용:${googleOnly.length})`);

    // ── 쇼핑몰별 분류 ──
    const musinsa = allItems.filter(i => i.mall === 'musinsa').slice(0, 5);
    const cm29 = allItems.filter(i => i.mall === '29cm').slice(0, 5);
    const kream = allItems.filter(i => i.mall === 'kream').slice(0, 5);
    const official = allItems.filter(i => i.mall === 'official').slice(0, 5);

    console.log(`[분류] 무신사:${musinsa.length}, 29CM:${cm29.length}, 크림:${kream.length}, 공식몰:${official.length}`);

    // ── 최저가 비교 ──
    const priceComparison = buildPriceComparison(allItems);
    if (priceComparison) {
      console.log(`[최저가] ${priceComparison.lowestItem.mallLabel} ${priceComparison.lowestItem.price?.toLocaleString()}원 (${priceComparison.savingRate}% 절약 가능)`);
    }

    // ── 유사 상품 제안 ──
    const suggestions = allItems
      .filter(i => i.similarityScore >= 0.15 && i.similarityScore < 0.5)
      .slice(0, 5);

    return res.json({
      success: true,
      keyword,
      totalCount: allItems.length,
      sources: {
        naver: naverItems.length,
        google: googleOnly.length,
      },
      results: { musinsa, '29cm': cm29, kream, official },
      combined: allItems.slice(0, 20),
      priceComparison,
      suggestions,
    });

  } catch (error) {
    console.error('[치명적 에러]', error.message);
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// API 2: URL 직접 스크래핑
// ==========================================
app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL을 입력해주세요.' });

  console.log(`\n[Scrape] ${url}`);
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new", args: BROWSER_ARGS });
    const page = await browser.newPage();
    await page.setUserAgent(DESKTOP_UA);
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

    const data = await page.evaluate(() => {
      function cleanText(t) { return t ? String(t).replace(/\s+/g, ' ').trim() : ''; }
      function findPrice() {
        const matches = document.body.textContent.match(/[\d,]+원/g) || [];
        const nums = matches
          .map(p => parseInt(p.replace(/[^0-9]/g, ''), 10))
          .filter(n => n >= 1000 && n < 10000000);
        return nums.length ? Math.min(...nums) : null;
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      const ogUrl = document.querySelector('meta[property="og:url"]');
      return {
        name: ogTitle ? cleanText(ogTitle.content) : cleanText(document.title),
        price: findPrice(),
        imageUrl: ogImage ? ogImage.content : null,
        canonicalUrl: ogUrl ? ogUrl.content : null,
      };
    });

    await browser.close();
    console.log(`[Scrape Done] ${data.name} / ${data.price}원`);
    return res.json({
      success: true,
      data: { siteUrl: data.canonicalUrl || url, name: data.name, currentPrice: data.price, imageUrl: data.imageUrl }
    });

  } catch (err) {
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// API 3: 가격 업데이트 (네이버 API 기반)
// ==========================================
app.post('/api/update-price', async (req, res) => {
  const { productName, currentPrice } = req.body;
  if (!productName) return res.status(400).json({ error: '상품명이 필요합니다.' });

  try {
    const naverResult = await fetchNaverShopping(productName, 10);
    const items = (naverResult.items || [])
      .map(item => formatNaverItem(item, productName))
      .filter(item => item.similarityScore >= 0.5)
      .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

    if (items.length === 0) {
      return res.json({ success: true, updated: false, reason: '일치 상품 없음' });
    }

    const lowestPrice = items[0].price;
    const priceChanged = currentPrice != null && lowestPrice !== currentPrice;

    return res.json({
      success: true,
      updated: priceChanged,
      previousPrice: currentPrice,
      currentPrice: lowestPrice,
      lowestMall: items[0].mallLabel,
      priceComparison: buildPriceComparison(items),
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 서버 실행
// ==========================================
app.listen(PORT, () => {
  console.log(`\n🚀 Price Tracker 서버 실행 중!`);
  console.log(`   http://localhost:${PORT}\n`);
  console.log(`   아키텍처: 네이버 API (메인) + Google 스크래핑 (보조)\n`);
  console.log(`   POST /api/search       - 상품 검색`);
  console.log(`   POST /api/scrape       - URL 직접 스크래핑`);
  console.log(`   POST /api/update-price - 가격 업데이트\n`);
});
