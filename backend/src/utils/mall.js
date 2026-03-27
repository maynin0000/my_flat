// src/utils/mall.js

const MALL_URL_MAP = [
  { pattern: 'musinsa.com', mall: 'musinsa', label: '무신사', isResell: false, priority: 1 },
  { pattern: '29cm.co.kr', mall: '29cm', label: '29CM', isResell: false, priority: 1 },
  { pattern: 'kream.co.kr', mall: 'kream', label: '크림', isResell: true, priority: 1 },
  { pattern: 'soldout.com', mall: 'soldout', label: '솔드아웃', isResell: true, priority: 1 },
  { pattern: 'nike.com', mall: 'nike', label: '나이키 공식', isResell: false, priority: 2 },
  { pattern: 'adidas.co.kr', mall: 'adidas', label: '아디다스 공식', isResell: false, priority: 2 },
  { pattern: 'newbalance.co.kr', mall: 'newbalance', label: '뉴발란스 공식', isResell: false, priority: 2 },
  { pattern: 'converse.co.kr', mall: 'converse', label: '컨버스 공식', isResell: false, priority: 2 },
  { pattern: 'vans.co.kr', mall: 'vans', label: '반스 공식', isResell: false, priority: 2 },
];

const MALL_NAME_MAP = [
  { patterns: ['무신사'], mall: 'musinsa', label: '무신사', isResell: false, priority: 1 },
  { patterns: ['29cm', '29씨엠'], mall: '29cm', label: '29CM', isResell: false, priority: 1 },
  { patterns: ['크림', 'kream'], mall: 'kream', label: '크림', isResell: true, priority: 1 },
  { patterns: ['솔드아웃'], mall: 'soldout', label: '솔드아웃', isResell: true, priority: 1 },
  { patterns: ['나이키공식', 'nike official'], mall: 'nike', label: '나이키 공식', isResell: false, priority: 2 },
  { patterns: ['아디다스공식', 'adidas official'], mall: 'adidas', label: '아디다스 공식', isResell: false, priority: 2 },
  { patterns: ['뉴발란스공식'], mall: 'newbalance', label: '뉴발란스 공식', isResell: false, priority: 2 },
];

// 🌟 우리가 관심 있는 패션 플랫폼 목록
const TARGET_MALLS = new Set([
  'musinsa', '29cm', 'kream', 'soldout',
  'nike', 'adidas', 'newbalance', 'converse', 'vans',
]);

function detectMall(url, mallName) {
  const lowerUrl = (url || '').toLowerCase();
  const lowerName = (mallName || '').toLowerCase();

  for (const item of MALL_URL_MAP) {
    if (lowerUrl.includes(item.pattern)) {
      return {
        mall: item.mall,
        mallLabel: item.label,
        isResell: item.isResell,
        priority: item.priority,
        isTarget: true,
      };
    }
  }

  for (const item of MALL_NAME_MAP) {
    if (item.patterns.some(p => lowerName.includes(p))) {
      return {
        mall: item.mall,
        mallLabel: item.label,
        isResell: item.isResell,
        priority: item.priority,
        isTarget: true,
      };
    }
  }

  return {
    mall: 'other',
    mallLabel: mallName || '기타',
    isResell: false,
    priority: 99,
    isTarget: false,
  };
}

// 🌟 우리 서비스 대상 쇼핑몰인지 확인
function isTargetMall(mall) {
  return TARGET_MALLS.has(mall);
}

function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function deduplicateByUrl(items) {
  const seen = new Set();
  return items.filter(item => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

module.exports = { detectMall, isTargetMall, stripHtml, deduplicateByUrl };
