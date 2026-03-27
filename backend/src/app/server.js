// src/app/server.js
const express = require('express');
const cors = require('cors');

const searchRouter = require('../domains/search/search.router');
const productRouter = require('../domains/product/product.router');
const wishlistRouter = require('../domains/wishlist/wishlist.router');
const logger = require('../utils/logger');

function createApp() {
  const app = express();

  // ── 미들웨어 ──
  app.use(cors());
  app.use(express.json());

  // 요청 로깅
  app.use((req, res, next) => {
    logger.info(`[${req.method}] ${req.path}`);
    next();
  });

  // ── 라우터 ──
  app.use('/api/search', searchRouter);
  app.use('/api/product', productRouter);
  app.use('/api/wishlist', wishlistRouter);

  // ── 헬스체크 ──
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ── 에러 핸들러 ──
  app.use((err, req, res, next) => {
    logger.error(`[Error] ${err.message}`);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || '서버 오류가 발생했습니다.',
    });
  });

  return app;
}

module.exports = { createApp };
