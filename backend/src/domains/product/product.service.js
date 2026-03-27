// src/domains/product/product.service.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { BROWSER } = require('../../config');
const { extractPrice } = require('../../utils/price');
const { detectMall } = require('../../utils/mall');
const logger = require('../../utils/logger');

puppeteer.use(StealthPlugin());

/**
 * 단일 상품 URL에서 실제 재고/가격 크롤링
 * 용도: 사용자가 특정 상품 상세 페이지 진입 시 실시간 데이터 조회
 */
async function scrapeProductDetail(url) {
  logger.info(`[Scrape] ${url}`);
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: BROWSER.ARGS,
    });

    const page = await browser.newPage();
    await page.setUserAgent(BROWSER.USER_AGENT);
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: BROWSER.TIMEOUT,
    });

    const data = await page.evaluate(() => {
      function cleanText(t) {
        return t ? String(t).replace(/\s+/g, ' ').trim() : '';
      }

      // 상품명
      function getName() {
        const og = document.querySelector('meta[property="og:title"]');
        if (og?.content?.length > 2) return cleanText(og.content);
        const h1 = document.querySelector('h1');
        if (h1?.textContent?.length > 2) return cleanText(h1.textContent);
        return cleanText(document.title);
      }

      // 가격
      function getPrice() {
        const matches = document.body.textContent.match(/[\d,]+원/g) || [];
        const nums = matches
          .map(p => parseInt(p.replace(/[^0-9]/g, ''), 10))
          .filter(n => n >= 1000 && n < 10000000);
        return nums.length > 0 ? Math.min(...nums) : null;
      }

      // 사이즈별 재고 (패션 앱 핵심 기능!)
      function getSizeStock() {
        const stock = {};
        const sizePattern = /^(XS|S|M|L|XL|XXL|FREE|OS|\d{2,3})$/i;

        const candidates = Array.from(
          document.querySelectorAll('button, li, option, [class*="size"], [class*="option"]')
        ).filter(el => {
          const text = (el.textContent || '').trim();
          return text.length <= 8 && sizePattern.test(text);
        }).slice(0, 30);

        candidates.forEach(el => {
          const label = (el.textContent || '').trim();
          if (!label) return;

          const cls = (el.getAttribute('class') || '').toLowerCase();
          const isSoldOut =
            el.disabled === true ||
            el.getAttribute('aria-disabled') === 'true' ||
            /sold|disabled|품절|outofstock/.test(cls) ||
            el.textContent.includes('품절');

          if (stock[label] === 'sold_out') return;
          stock[label] = isSoldOut ? 'sold_out' : 'in_stock';
        });

        return stock;
      }

      // 품절 상태
      function getStatus(sizeStock) {
        const bodyText = document.body.innerText.toLowerCase();
        if (/판매종료|종료됨|구매불가/.test(bodyText)) return 'ended';
        const keys = Object.keys(sizeStock);
        if (keys.length > 0 && keys.every(k => sizeStock[k] === 'sold_out')) return 'sold_out';
        if (/품절/.test(bodyText) && keys.length === 0) return 'sold_out';
        return 'on_sale';
      }

      const name = getName();
      const price = getPrice();
      const sizeStock = getSizeStock();
      const status = getStatus(sizeStock);
      const ogImage = document.querySelector('meta[property="og:image"]');

      return {
        name,
        price,
        sizeStock,
        status,
        imageUrl: ogImage?.content || null,
      };
    });

    await browser.close();
    const { mall, mallLabel, isResell } = detectMall(url, '');
    logger.success(`[Scrape] 완료 - ${data.name} / ${data.price?.toLocaleString()}원 / ${data.status}`);

    return {
      success: true,
      data: {
        ...data,
        url,
        mall,
        mallLabel,
        isResell,
      },
    };

  } catch (err) {
    logger.error(`[Scrape] 실패 - ${err.message}`);
    if (browser) await browser.close();
    return { success: false, error: err.message };
  }
}

module.exports = { scrapeProductDetail };
