// src/domains/search/search.router.js
const express = require('express');
const router = express.Router();
const { searchProducts, getPopularSearches } = require('./search.service');
const logger = require('../../utils/logger');

/**
 * POST /api/search
 * 통합 상품 검색
 */
router.post('/', async (req, res, next) => {
  try {
    // UTF-8 안전 처리
    const keyword = req.body?.keyword
      ? Buffer.from(String(req.body.keyword), 'utf8').toString('utf8').trim()
      : '';

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: '검색어를 입력해주세요.',
      });
    }

    if (keyword.length > 50) {
      return res.status(400).json({
        success: false,
        error: '검색어는 50자 이하로 입력해주세요.',
      });
    }

    const result = await searchProducts(keyword);

    return res.json({
      success: true,
      ...result,
    });

  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/popular
 * 인기 검색어 목록
 */
router.get('/popular', (req, res) => {
  const keywords = getPopularSearches();
  res.json({ success: true, keywords });
});

module.exports = router;
