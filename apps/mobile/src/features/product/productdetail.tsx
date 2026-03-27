// apps/mobile/src/features/product/productdetail.tsx
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../shared/theme/theme'; // 수정된 경로
import { MasterProduct } from '../../types/product';

export const Productdetail = ({ route }: any) => {
  const { product }: { product: MasterProduct } = route.params;
  const [isCrawling, setIsCrawling] = useState(false);

  // 실시간 재고 확인 함수 (나중에 API 연결)
  const checkRealtimeStock = async () => {
    setIsCrawling(true);
    // TODO: 백엔드 Puppeteer API 호출
    setTimeout(() => setIsCrawling(false), 2000); 
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.imageUrl || '' }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{product.lowestPrice.toLocaleString()}원~</Text>
        
        <TouchableOpacity 
          style={styles.stockButton} 
          onPress={checkRealtimeStock}
          disabled={isCrawling}
        >
          <Text style={styles.stockButtonText}>
            {isCrawling ? '🔍 재고 파악 중...' : '⚡ 실시간 사이즈별 재고 확인'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>판매처 비교</Text>
        {[...product.regularOffers, ...product.resellOffers].map((offer, idx) => (
          <View key={idx} style={styles.offerRow}>
            <Text style={styles.mallName}>{offer.mallLabel}</Text>
            <View style={styles.offerRight}>
              <Text style={styles.offerPrice}>{offer.price.toLocaleString()}원</Text>
              <TouchableOpacity style={styles.goButton}>
                <Text style={styles.goButtonText}>이동</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  image: { width: '100%', height: 400, backgroundColor: '#f9f9f9' },
  content: { padding: theme.spacing.m },
  brand: { fontSize: theme.fontSize.body, color: theme.colors.textSecondary },
  name: { fontSize: theme.fontSize.header, fontWeight: 'bold', marginVertical: theme.spacing.s },
  price: { fontSize: theme.fontSize.title, fontWeight: 'bold', color: theme.colors.primary },
  stockButton: { 
    backgroundColor: theme.colors.primary, 
    padding: theme.spacing.m, 
    borderRadius: theme.borderRadius.m, 
    marginTop: theme.spacing.l,
    alignItems: 'center'
  },
  stockButtonText: { color: '#fff', fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.l },
  sectionTitle: { fontSize: theme.fontSize.subTitle, fontWeight: 'bold', marginBottom: theme.spacing.m },
  offerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  mallName: { fontSize: theme.fontSize.body, fontWeight: '500' },
  offerRight: { flexDirection: 'row', alignItems: 'center' },
  offerPrice: { fontSize: theme.fontSize.body, fontWeight: 'bold', marginRight: theme.spacing.s },
  goButton: { backgroundColor: '#eee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  goButtonText: { fontSize: theme.fontSize.caption, fontWeight: '600' }
});