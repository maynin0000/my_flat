// src/domains/wishlist/wishlist.router.js
const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require('./wishlist.service');

router.get('/', (req, res) => {
  const items = getWishlist();
  res.json({ success: true, items });
});

router.post('/', (req, res) => {
  const { productId, name, lowestPrice, imageUrl } = req.body;
  if (!productId) return res.status(400).json({ success: false, error: 'productId 필요' });
  const result = addToWishlist('default', { productId, name, lowestPrice, imageUrl });
  res.json(result);
});

router.delete('/:productId', (req, res) => {
  const result = removeFromWishlist('default', req.params.productId);
  res.json(result);
});

module.exports = router;
