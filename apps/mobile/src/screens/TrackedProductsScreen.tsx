import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { COLORS } from "../constants/theme";
import { useTrackedItems } from "../context/TrackedItemsContext";
import { mockCompareMap } from "../mock/priceCompare";
import type { RootStackParamList, TrackedItemWithOffers } from "../types/navigation";
import type { ComparePriceItem } from "../types/priceCompare";
import type { TrackedListing } from "../types/trackedListing";
import { formatPrice, getChangeDisplay, getChangeLabel, getChangeType, sortTrackedListings } from "../utils/trackedListing";

type Props = NativeStackScreenProps<RootStackParamList, "TrackedProducts">;
type FilterType = "all" | "price_drop" | "restocked" | "sold_out" | "favorite";

function getColumnCount(width: number) { return Platform.OS !== "web" ? (width < 520 ? 1 : 2) : (width >= 1480 ? 4 : width >= 1120 ? 3 : width >= 760 ? 2 : 1); }
function formatCheckedAt(dateString: string) { const d = new Date(dateString); return Number.isNaN(d.getTime()) ? "확인 기록 없음" : `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} 확인`; }
function countInStockSizes(item: TrackedListing) { return Object.values(item.sizes).filter(v => v === "in_stock").length; }
function getOptionStatus(item: TrackedListing) {
  const inStock = countInStockSizes(item), total = Object.keys(item.sizes ?? {}).length;
  if (inStock <= 0) return { label: "품절", subLabel: "구매 가능한 옵션 없음", bg: COLORS.graySoft, color: "#6B7280" };
  if (inStock <= 2) return { label: "품절 임박", subLabel: `가능 사이즈 ${inStock}개`, bg: "#FFF7ED", color: COLORS.yellow };
  if (total > 0 && inStock < total) return { label: "일부 옵션 구매 가능", subLabel: `가능 사이즈 ${inStock}개`, bg: COLORS.blueSoft, color: COLORS.blue };
  return { label: "구매 가능", subLabel: total > 0 ? `가능 사이즈 ${inStock}개` : "구매 가능한 옵션 확인", bg: COLORS.greenSoft, color: COLORS.green };
}
function getStatusStyle(type: ReturnType<typeof getChangeType>) { switch (type) { case "price_drop": return { backgroundColor: COLORS.blueSoft, textColor: COLORS.blue }; case "restocked": return { backgroundColor: COLORS.greenSoft, textColor: COLORS.green }; case "price_up": return { backgroundColor: COLORS.redSoft, textColor: COLORS.red }; default: return { backgroundColor: COLORS.graySoft, textColor: "#6B7280" }; } }
function getChangeAccent(item: TrackedListing) { const type = getChangeType(item); switch (type) { case "price_drop": return { color: COLORS.blue, bg: COLORS.blueSoft, text: getChangeDisplay(item) }; case "price_up": return { color: COLORS.red, bg: COLORS.redSoft, text: getChangeDisplay(item) }; case "restocked": return { color: COLORS.green, bg: COLORS.greenSoft, text: "재입고 확인" }; case "sold_out": return { color: "#6B7280", bg: COLORS.graySoft, text: "현재 품절" }; default: return { color: "#6B7280", bg: COLORS.graySoft, text: "변동 없음" }; } }
function getLowestPriceSiteFromCompare(items: ComparePriceItem[] | undefined) { return items?.filter(i => i.price != null).reduce((min, cur) => ((cur.price ?? Infinity) < (min.price ?? Infinity) ? cur : min), { price: Infinity } as ComparePriceItem) ?? null; }
function getLowestPriceSiteFromOffers(offers: any[] | undefined) { return offers?.length ? offers.reduce((min, cur) => (cur.price < min.price ? cur : min)) : null; }
function getCompareCount(item: TrackedItemWithOffers) { return item.offers?.length || (mockCompareMap[item.id] ?? []).length; }
function getOfferMallLabels(item: TrackedItemWithOffers) { return item.offers?.length ? item.offers.map(o => o.mallLabel) : (mockCompareMap[item.id] ?? []).map(s => s.siteLabel); }
function getPriceSpreadText(item: TrackedItemWithOffers) { const prices = (item.offers?.length ? item.offers.map(o => o.price) : (mockCompareMap[item.id] ?? []).map(s => s.price)).filter(p => p != null); if (!prices || prices.length < 2) return null; const diff = Math.max(...prices) - Math.min(...prices); return diff > 0 ? `최고가 대비 ${diff.toLocaleString("ko-KR")}원 차이` : null; }

function SummaryChip({ label, value }: { label: string; value: number }) { return ( <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: COLORS.border, marginRight: 8, minWidth: 84 }}> <Text style={{ fontSize: 11, color: COLORS.subText, marginBottom: 3 }}>{label}</Text> <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>{value}</Text> </View> ); }

function SkeletonThumbnail() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true })])).start(); }, [opacity]);
  return <Animated.View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "#E5E7EB", opacity: opacity, marginRight: 12, flexShrink: 0, borderWidth: 1, borderColor: COLORS.border }} />;
}

export default function TrackedProductsScreen({ navigation }: Props) {
  const { items, toggleFavorite } = useTrackedItems();
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const { width } = useWindowDimensions();
  const columnCount = getColumnCount(width);
  const pagePadding = 14, gap = 12;
  const cardWidth = Platform.OS === "web" ? Math.min(420, (width - pagePadding * 2 - gap * (columnCount - 1)) / columnCount) : (width - pagePadding * 2 - gap * (columnCount - 1)) / columnCount;

  const summary = useMemo(() => ({ total: items.length, favorite: items.filter(i => i.isPinned).length, priceDrop: items.filter(i => getChangeType(i) === "price_drop").length, restocked: items.filter(i => getChangeType(i) === "restocked").length }), [items]);

  const visibleItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase().replace(/\s+/g, "");
    const searched = items.filter((item) => {
      if (!keyword) return true;
      const lowest = item.offers?.length ? getLowestPriceSiteFromOffers(item.offers) : getLowestPriceSiteFromCompare(mockCompareMap[item.id] ?? []);
      const target = [item.name, item.brand, lowest?.mallLabel ?? lowest?.siteLabel].join("").toLowerCase().replace(/\s+/g, "");
      return target.includes(keyword);
    });
    const filtered = searched.filter((item) => {
      const type = getChangeType(item);
      if (filter === "price_drop") return type === "price_drop";
      if (filter === "restocked") return type === "restocked";
      if (filter === "sold_out") return type === "sold_out";
      if (filter === "favorite") return item.isPinned;
      return true;
    });
    return sortTrackedListings(filtered);
  }, [items, filter, searchText]);

  const renderFilterChip = (value: FilterType, label: string) => (
    <Pressable key={value} onPress={() => setFilter(value)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: filter === value ? COLORS.black : COLORS.border, backgroundColor: filter === value ? COLORS.black : COLORS.surface, marginRight: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: filter === value ? "#FFFFFF" : "#374151" }}>{label}</Text>
    </Pressable>
  );

  const renderCard = ({ item }: { item: TrackedItemWithOffers }) => {
    const type = getChangeType(item);
    const lowestSite = item.offers?.length ? getLowestPriceSiteFromOffers(item.offers) : getLowestPriceSiteFromCompare(mockCompareMap[item.id] ?? []);

    return (
      <Pressable onPress={() => navigation.navigate("ProductDetail", { item })} style={{ width: cardWidth, minHeight: 160, borderRadius: 18, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: gap, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <SkeletonThumbnail />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", minWidth: 0, flex: 1 }}>
                {item.brand ? <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "800", color: COLORS.text, marginRight: 8 }}>{item.brand}</Text> : null}
                {lowestSite?.price !== Infinity && lowestSite ? (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: COLORS.purpleSoft }}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: COLORS.purple }}>최저가 {"mallLabel" in lowestSite ? lowestSite.mallLabel : lowestSite.siteLabel}</Text>
                  </View>
                ) : null}
              </View>
              <Pressable onPress={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} hitSlop={8} style={{ width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: item.isPinned ? COLORS.yellowSoft : "#F8FAFC", borderWidth: 1, borderColor: item.isPinned ? COLORS.yellowBorder : COLORS.border, marginLeft: 10 }}>
                <Text style={{ fontSize: 14 }}>{item.isPinned ? "★" : "☆"}</Text>
              </Pressable>
            </View>

            <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, fontWeight: "700", color: COLORS.text, marginBottom: 8, minHeight: 36 }}>
              {item.name ?? "이름 없음"} {item.targetSize ? <Text style={{color: COLORS.blue}}>({item.targetSize})</Text> : null}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
              <Text style={{ fontSize: 19, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 }}>{formatPrice(item.currentPrice)}</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: getChangeAccent(item).bg }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: getChangeAccent(item).color }}>{getChangeAccent(item).text}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7, gap: 8 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: getStatusStyle(type).backgroundColor }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: getStatusStyle(type).textColor }}>{getChangeLabel(item)}</Text>
              </View>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: getOptionStatus(item).bg }}>
                <Text style={{ fontSize: 10, fontWeight: "800", color: getOptionStatus(item).color }}>{getOptionStatus(item).label}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
               <Text numberOfLines={1} style={{ flex: 1, fontSize: 11, color: COLORS.subText, fontWeight: "600", marginRight: 8 }}>{getPriceSpreadText(item) ?? getOptionStatus(item).subLabel}</Text>
               <Text style={{ fontSize: 10, color: COLORS.muted }}>{formatCheckedAt(item.lastCheckedAt)}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={{ paddingBottom: 14 }}>
      <View style={{ borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14 }}>
        <View style={{ flexDirection: width < 620 ? "column" : "row", justifyContent: "space-between", alignItems: width < 620 ? "stretch" : "center", marginBottom: 14, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3 }}>추적 상품</Text>
            <Text style={{ fontSize: 13, color: COLORS.subText, marginTop: 5 }}>가격 하락, 재입고, 최저가 쇼핑몰을 빠르게 확인하세요</Text>
          </View>
          <Pressable onPress={() => navigation.navigate("AddProduct")} style={{ backgroundColor: COLORS.black, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>+ 상품 추가</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ paddingRight: 8 }}>
          <SummaryChip label="전체 추적" value={summary.total} />
          <SummaryChip label="가격 하락" value={summary.priceDrop} />
          <SummaryChip label="재입고" value={summary.restocked} />
          <SummaryChip label="즐겨찾기" value={summary.favorite} />
        </ScrollView>
        <TextInput value={searchText} onChangeText={setSearchText} placeholder="상품명, 브랜드, 최저가 검색" placeholderTextColor="#9CA3AF" style={{ backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: COLORS.text }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
        {renderFilterChip("all", "전체")}
        {renderFilterChip("price_drop", "가격 하락")}
        {renderFilterChip("restocked", "재입고")}
        {renderFilterChip("sold_out", "품절")}
        {renderFilterChip("favorite", "즐겨찾기")}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList data={visibleItems} keyExtractor={(item) => item.id} renderItem={renderCard} ListHeaderComponent={ListHeader} contentContainerStyle={{ paddingHorizontal: pagePadding, paddingTop: 14, paddingBottom: 28 }} numColumns={columnCount} key={`grid-${columnCount}`} columnWrapperStyle={columnCount > 1 ? { gap } : undefined} />
    </SafeAreaView>
  );
}
