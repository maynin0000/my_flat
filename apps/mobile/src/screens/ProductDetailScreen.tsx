import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useRef, useState } from "react";
import { Alert, Dimensions, Linking, PanResponder, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";
import { COLORS } from "../constants/theme";
import { mockCompareMap } from "../mock/priceCompare";
import { mockPriceHistoryMap } from "../mock/priceHistory";
import type { RootStackParamList } from "../types/navigation";
import { formatPrice, getChangeLabel, getChangeType } from "../utils/trackedListing";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetail">;
type PriceHistoryPoint = { label: string; price: number; };

function getDiscountedPrice(price: number | null, couponPercent: number | null, maxLimit: number | null): number | null {
  if (price == null) return null;
  if (couponPercent == null || Number.isNaN(couponPercent) || couponPercent <= 0) return price;
  let discountAmount = price * (couponPercent / 100);
  if (maxLimit != null && maxLimit > 0 && discountAmount > maxLimit) discountAmount = maxLimit;
  return Math.floor(price - discountAmount);
}

function formatDateTime(dateString: string) { const d = new Date(dateString); return Number.isNaN(d.getTime()) ? dateString : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
function getCouponSupport(site: string) { switch (site) { case "musinsa": return { supportsCoupon: true, couponText: "쿠폰 입력 가능" }; case "official": return { supportsCoupon: true, couponText: "공식몰 쿠폰 가능" }; case "29cm": return { supportsCoupon: true, couponText: "스토어 쿠폰 가능" }; default: return { supportsCoupon: false, couponText: "쿠폰 적용 어려움" }; } }

function Card({ children, style }: any) { return <View style={[{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, backgroundColor: COLORS.surface, padding: 16, marginBottom: 14 }, style]}>{children}</View>; }
function SectionTitle({ eyebrow, title, description }: any) { return <View style={{ marginBottom: 12 }}>{eyebrow && <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 4 }}>{eyebrow}</Text>}<Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text, marginBottom: description ? 4 : 0 }}>{title}</Text>{description && <Text style={{ fontSize: 13, color: COLORS.subText, lineHeight: 19 }}>{description}</Text>}</View>; }
function MetricBox({ label, value, subValue, accent = "default" }: any) { const accentStyle = accent === "blue" ? { backgroundColor: COLORS.blueSoft, borderColor: "#DCE8FF" } : accent === "green" ? { backgroundColor: COLORS.greenSoft, borderColor: "#DCEFE1" } : { backgroundColor: "#FAFAFA", borderColor: "#F0F0F0" }; return <View style={{ flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, ...accentStyle }}><Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 6 }}>{label}</Text><Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>{value}</Text>{subValue && <Text style={{ fontSize: 12, color: COLORS.subText, marginTop: 6, lineHeight: 18 }}>{subValue}</Text>}</View>; }
function getStatusPill(item: any) { const type = getChangeType(item); switch (type) { case "price_drop": return { bg: COLORS.blueSoft, color: COLORS.blue, text: getChangeLabel(item) }; case "restocked": return { bg: COLORS.greenSoft, color: COLORS.green, text: getChangeLabel(item) }; case "price_up": return { bg: COLORS.redSoft, color: COLORS.red, text: getChangeLabel(item) }; default: return { bg: COLORS.graySoft, color: "#6B7280", text: getChangeLabel(item) }; } }

function InteractivePriceChart({ data, width, height = 250 }: any) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(data.length > 0 ? data.length - 1 : null);
  const paddingTop = 18, paddingBottom = 34, paddingLeft = 18, paddingRight = 18;
  const chartWidth = width - paddingLeft - paddingRight, chartHeight = height - paddingTop - paddingBottom;
  
  const prices = data.map((i: any) => i.price);
  const minPrice = Math.min(...prices), maxPrice = Math.max(...prices), priceRange = Math.max(maxPrice - minPrice, 1);
  const firstPrice = data.length > 0 ? data[0].price : 0;
  const lastPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const chartColor = lastPrice >= firstPrice ? "#F04452" : "#3182F6";

  function getX(index: number) { return data.length === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (index / (data.length - 1)) * chartWidth; }
  function getY(price: number) { return paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight; }

  const points = data.map((item: any, index: number) => ({ x: getX(index), y: getY(item.price), label: item.label, price: item.price }));
  const pathD = points.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillPathD = `${pathD} L ${points[points.length - 1]?.x} ${paddingTop + chartHeight} L ${points[0]?.x} ${paddingTop + chartHeight} Z`;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => setSelectedIndex(Math.max(0, Math.min(Math.round(((e.nativeEvent.locationX - paddingLeft) / chartWidth) * (data.length - 1)), data.length - 1))),
    onPanResponderMove: (e) => setSelectedIndex(Math.max(0, Math.min(Math.round(((e.nativeEvent.locationX - paddingLeft) / chartWidth) * (data.length - 1)), data.length - 1))),
  })).current;

  const selectedPoint = selectedIndex != null ? points[selectedIndex] : null;

  return (
    <View style={{ borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#F0F0F0", overflow: "hidden" }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={chartColor} stopOpacity="0.25" />
            <Stop offset="1" stopColor={chartColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        {[0, 1, 2, 3, 4].map(i => <Line key={i} x1={paddingLeft} y1={paddingTop + chartHeight * (i / 4)} x2={width - paddingRight} y2={paddingTop + chartHeight * (i / 4)} stroke="#ECECEC" strokeWidth="1" />)}
        <Path d={fillPathD} fill="url(#chartGradient)" />
        <Path d={pathD} fill="none" stroke={chartColor} strokeWidth={2.5} />
        {selectedPoint && (
          <><Line x1={selectedPoint.x} y1={paddingTop} x2={selectedPoint.x} y2={paddingTop + chartHeight} stroke={chartColor} strokeDasharray="4 4" /><Circle cx={selectedPoint.x} cy={selectedPoint.y} r="5" fill="#FFFFFF" stroke={chartColor} strokeWidth="2.5" /></>
        )}
      </Svg>
      <View {...panResponder.panHandlers} style={{ position: "absolute", width, height }} />
      {selectedPoint && (
        <View pointerEvents="none" style={{ position: "absolute", left: Math.max(8, Math.min(selectedPoint.x - 62, width - 132)), top: Math.max(8, selectedPoint.y - 72), backgroundColor: chartColor, borderRadius: 12, padding: 8, elevation: 3 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 10, opacity: 0.9 }}>{selectedPoint.label}</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>{formatPrice(selectedPoint.price)}</Text>
        </View>
      )}
    </View>
  );
}

export default function ProductDetailScreen({ route }: Props) {
  const { item } = route.params;
  const compareItems = useMemo(() => item.offers?.map((o: any) => ({ site: o.mall, siteLabel: o.mallLabel, price: o.price, url: o.url, ...getCouponSupport(o.mall) })) ?? (mockCompareMap[item.id] ?? []).map((s: any) => ({ site: s.site, siteLabel: s.siteLabel, price: s.price, url: s.url, supportsCoupon: s.supportsCoupon, couponText: s.couponText ?? "" })), [item]);
  const priceHistory = useMemo(() => mockPriceHistoryMap[item.id] ?? [{ label: "오늘", price: item.currentPrice }], [item]);
  
  const [couponInputs, setCouponInputs] = useState<Record<string, { percent: string; maxLimit: string }>>({});
  const [targetPrice, setTargetPrice] = useState("");

  const compareItemsWithDiscount = useMemo(() => compareItems.map((site) => {
    const cp = Number(couponInputs[site.site]?.percent);
    const limit = Number(couponInputs[site.site]?.maxLimit);
    return { ...site, enteredCouponPercent: cp, discountedPrice: site.supportsCoupon && cp > 0 && cp <= 100 ? getDiscountedPrice(site.price, cp, limit > 0 ? limit : null) : site.price };
  }), [compareItems, couponInputs]);

  const cheapestItem = compareItemsWithDiscount.filter(s => s.price != null).reduce((m, c) => (c.price! < (m?.price ?? Infinity) ? c : m), null as any);
  const cheapestDiscountedItem = compareItemsWithDiscount.filter(s => s.discountedPrice != null).reduce((m, c) => (c.discountedPrice! < (m?.discountedPrice ?? Infinity) ? c : m), null as any);
  
  const prices = priceHistory.map(p => p.price);
  const minPrice = Math.min(...prices), maxPrice = Math.max(...prices), avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const statusPill = getStatusPill(item);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        <Card style={{ padding: 18 }}>
           <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ width: 100, height: 100, borderRadius: 22, backgroundColor: "#F2F3F5", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border, marginRight: 16 }}>
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>이미지 없음</Text>
            </View>
            <View style={{ flex: 1 }}>
              {item.brand && <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.subText }}>{item.brand}</Text>}
              <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text, marginVertical: 6 }}>
                {item.name} {item.targetSize ? <Text style={{color: COLORS.blue}}>({item.targetSize})</Text> : null}
              </Text>
              <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: statusPill.bg }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: statusPill.color }}>{statusPill.text}</Text>
              </View>
            </View>
          </View>
        </Card>

        <Card>
          <SectionTitle eyebrow="가격 흐름" title="최근 3개월 가격 변화" />
          <InteractivePriceChart data={priceHistory} width={Dimensions.get("window").width - 64} height={200} />
        </Card>

        <Card>
          <SectionTitle eyebrow="가격 비교" title="쇼핑몰별 구매 조건 비교" description="최대 할인 한도를 적용해 실구매가를 계산해보세요." />
          {compareItemsWithDiscount.map((siteItem) => {
             const isCheapest = cheapestItem?.site === siteItem.site;
             const isDiscountCheapest = cheapestDiscountedItem?.site === siteItem.site;
             
             return (
              <View key={siteItem.site} style={{ borderWidth: 1, borderColor: isDiscountCheapest ? "#CFE8D6" : isCheapest ? "#D8E5FF" : "#EEEEEE", borderRadius: 16, padding: 14, marginBottom: 10, backgroundColor: isDiscountCheapest ? "#F7FCF8" : isCheapest ? "#F7FAFF" : "#FFFFFF" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>{siteItem.siteLabel}</Text>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: COLORS.text }}>{formatPrice(siteItem.discountedPrice)}</Text>
                </View>

                {siteItem.supportsCoupon && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 6 }}>쿠폰 입력 (할인율 / 최대 한도)</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TextInput
                        value={couponInputs[siteItem.site]?.percent ?? ""}
                        onChangeText={(v) => setCouponInputs(p => ({ ...p, [siteItem.site]: { ...p[siteItem.site], percent: v.replace(/[^0-9]/g, "") } }))}
                        placeholder="예: 15%"
                        keyboardType="numeric"
                        style={{ flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 13, backgroundColor: "#FFF" }}
                      />
                      <TextInput
                        value={couponInputs[siteItem.site]?.maxLimit ?? ""}
                        onChangeText={(v) => setCouponInputs(p => ({ ...p, [siteItem.site]: { ...p[siteItem.site], maxLimit: v.replace(/[^0-9]/g, "") } }))}
                        placeholder="최대 한도 (예: 15000)"
                        keyboardType="numeric"
                        style={{ flex: 1.5, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 13, backgroundColor: "#FFF" }}
                      />
                    </View>
                  </View>
                )}
                <Pressable onPress={() => Linking.openURL(siteItem.url)} style={{ marginTop: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: isDiscountCheapest ? COLORS.green : COLORS.black, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>구매하러 가기</Text>
                </Pressable>
              </View>
            );
          })}
        </Card>

        <Card style={{ backgroundColor: "#F9FAFC", borderColor: "#E2E8F0" }}>
          <SectionTitle eyebrow="알림 설정" title="원하는 가격에 알림 받기" description="현재가보다 저렴해지면 푸시 알림을 보내드릴게요." />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14 }}>
              <TextInput value={targetPrice} onChangeText={(text) => setTargetPrice(text.replace(/[^0-9]/g, ""))} placeholder="예: 100000" keyboardType="numeric" style={{ flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: "700" }} />
              <Text style={{ fontSize: 16, color: COLORS.text, fontWeight: "700" }}>원</Text>
            </View>
            <Pressable onPress={() => Alert.alert("알림 설정 완료", `${Number(targetPrice).toLocaleString()}원이 되면 알려드릴게요!`)} style={{ backgroundColor: COLORS.blue, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 14 }}>설정</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
