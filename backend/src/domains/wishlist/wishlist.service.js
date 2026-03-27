// src/domains/wishlist/wishlist.service.js
// 서버 메모리에 임시 저장 (추후 DB로 교체)
// 클라이언트는 AsyncStorage에 저장하므로 서버는 가볍게 유지

const wishlistStore = new Map();

/**
 * 위시리스트 조회
 */
function getWishlist(userId = 'default') {
  return Array.from(wishlistStore.values()).filter(item => item.userId === userId);
}

/**
 * 위시리스트 추가
 */
function addToWishlist(userId = 'default', product) {
  const key = `${userId}_${product.productId}`;
  if (wishlistStore.has(key)) {
    return { success: false, message: '이미 찜한 상품입니다.' };
  }
  wishlistStore.set(key, {
    userId,
    productId: product.productId,
    name: product.name,
    lowestPrice: product.lowestPrice,
    imageUrl: product.imageUrl || null,
    savedAt: new Date().toISOString(),
  });
  return { success: true, message: '찜 목록에 추가됐어요.' };
}

/**
 * 위시리스트 삭제
 */
function removeFromWishlist(userId = 'default', productId) {
  const key = `${userId}_${productId}`;
  if (!wishlistStore.has(key)) {
    return { success: false, message: '찜 목록에 없는 상품입니다.' };
  }
  wishlistStore.delete(key);
  return { success: true, message: '찜 목록에서 삭제됐어요.' };
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
