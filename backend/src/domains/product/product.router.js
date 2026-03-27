// src/domains/product/product.router.js
const express = require('express');
const router = express.Router();
const { scrapeProductDetail } = require('./product.service');

/**
 * POST /api/product/detail
 * 단일 상품 URL 크롤링 (사이즈 재고 포함)
 */
router.post('/detail', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL을 입력해주세요.',
      });
    }

    const result = await scrapeProductDetail(url);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || '크롤링 실패',
      });
    }

    return res.json({ success: true, data: result.data });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
