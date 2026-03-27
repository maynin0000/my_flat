// apps/mobile/src/features/search/mastercard.tsx
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MasterProduct } from '../../types/product';
import { useCloset } from '../wishlist/closetcontext';

interface Props {
  product: MasterProduct;
  onPress: () => void;
}

export const Mastercard: React.FC<Props> = ({ product, onPress }) => {
  const { toggleWishlist, isInWishlist } = useCloset();
  const isFavorite = isInWishlist(product.id);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: product.imageUrl || '' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.lowestPrice}>
            {product.lowestPrice.toLocaleString()}원
          </Text>
          <Text style={styles.platformCount}>{product.platformCount}개 몰 비교 중</Text>
        </View>

        {/* 리셀가 배지 (있을 경우만) */}
        {product.resellOffers.length > 0 && (
          <View style={styles.resellBadge}>
            <Text style={styles.resellText}>KREAM 리셀가 포함</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.wishButton} 
        onPress={() => toggleWishlist(product)}
      >
        <Text style={{ color: isFavorite ? 'red' : '#ccc' }}>{isFavorite ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', marginBottom: 1, borderRadius: 12 },
  image: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#f5f5f5' },
  info: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  brand: { fontSize: 12, color: '#888', fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '500', marginTop: 4, color: '#222' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  lowestPrice: { fontSize: 17, fontWeight: 'bold', color: '#000' },
  platformCount: { fontSize: 11, color: '#999', marginLeft: 8 },
  resellBadge: { marginTop: 6, backgroundColor: '#f0f9ff', paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', borderRadius: 4 },
  resellText: { fontSize: 10, color: '#007aff', fontWeight: 'bold' },
  wishButton: { padding: 10 },
});