import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import type { RootStackParamList } from "../../App";
import { mockCompareMap } from "../mock/priceCompare";
import { mockPriceHistoryMap } from "../mock/priceHistory";
import {
  formatPrice,
  getChangeDisplay,
  getChangeLabel,
  getChangeType,
} from "../utils/trackedListing";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetail">;

type PriceHistoryPoint = {
  label: string;
  price: number;
};

const COLORS = {
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  border: "#E7EBF0",
  text: "#111827",
  subText: "#6B7280",
  muted: "#9CA3AF",
  black: "#111111",
  blue: "#2563EB",
  blueSoft: "#EEF4FF",
  green: "#16A34A",
  greenSoft: "#ECFDF3",
  red: "#E11D48",
  redSoft: "#FFF1F2",
  graySoft: "#F3F4F6",
};

function getDiscountedPrice(
  price: number | null,
  couponPercent: number | null
): number | null {
  if (price == null) return null;
  if (couponPercent == null || Number.isNaN(couponPercent) || couponPercent <= 0) {
    return price;
  }
  return Math.floor(price * (1 - couponPercent / 100));
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hour}:${minute}`;
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 18,
          backgroundColor: COLORS.surface,
          padding: 16,
          marginBottom: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      {eyebrow ? (
        <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 4 }}>
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: COLORS.text,
          marginBottom: description ? 4 : 0,
        }}
      >
        {title}
      </Text>
      {description ? (
        <Text style={{ fontSize: 13, color: COLORS.subText, lineHeight: 19 }}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

function MetricBox({
  label,
  value,
  subValue,
  accent = "default",
}: {
  label: string;
  value: string;
  subValue?: string;
  accent?: "default" | "blue" | "green";
}) {
  const accentStyle =
    accent === "blue"
      ? { backgroundColor: COLORS.blueSoft, borderColor: "#DCE8FF" }
      : accent === "green"
      ? { backgroundColor: COLORS.greenSoft, borderColor: "#DCEFE1" }
      : { backgroundColor: "#FAFAFA", borderColor: "#F0F0F0" };

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        ...accentStyle,
      }}
    >
      <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 6 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>
        {value}
      </Text>
      {subValue ? (
        <Text style={{ fontSize: 12, color: COLORS.subText, marginTop: 6, lineHeight: 18 }}>
          {subValue}
        </Text>
      ) : null}
    </View>
  );
}

function getStatusPill(item: Props["route"]["params"]["item"]) {
  const type = getChangeType(item);

  switch (type) {
    case "price_drop":
      return {
        bg: COLORS.blueSoft,
        color: COLORS.blue,
        text: getChangeLabel(item),
      };
    case "restocked":
      return {
        bg: COLORS.greenSoft,
        color: COLORS.green,
        text: getChangeLabel(item),
      };
    case "price_up":
      return {
        bg: COLORS.redSoft,
        color: COLORS.red,
        text: getChangeLabel(item),
      };
    case "sold_out":
      return {
        bg: COLORS.graySoft,
        color: "#6B7280",
        text: getChangeLabel(item),
      };
    default:
      return {
        bg: COLORS.graySoft,
        color: "#6B7280",
        text: getChangeLabel(item),
      };
  }
}

function InteractivePriceChart({
  data,
  width,
  height = 250,
}: {
  data: PriceHistoryPoint[];
  width: number;
  height?: number;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    data.length > 0 ? data.length - 1 : null
  );

  const paddingTop = 18;
  const paddingBottom = 34;
  const paddingLeft = 18;
  const paddingRight = 18;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const prices = data.map((item) => item.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = Math.max(maxPrice - minPrice, 1);

  function getX(index: number) {
    if (data.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  }

  function getY(price: number) {
    const normalized = (price - minPrice) / priceRange;
    return paddingTop + chartHeight - normalized * chartHeight;
  }

  const points = data.map((item, index) => ({
    x: getX(index),
    y: getY(item.price),
    label: item.label,
    price: item.price,
  }));

  const pathD = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  function findNearestIndex(touchX: number) {
    if (data.length === 0) return null;

    const clampedX = Math.max(paddingLeft, Math.min(touchX, width - paddingRight));
    const ratio = (clampedX - paddingLeft) / chartWidth;
    const roughIndex = Math.round(ratio * (data.length - 1));

    return Math.max(0, Math.min(roughIndex, data.length - 1));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        const index = findNearestIndex(evt.nativeEvent.locationX);
        setSelectedIndex(index);
      },

      onPanResponderMove: (evt) => {
        const index = findNearestIndex(evt.nativeEvent.locationX);
        setSelectedIndex(index);
      },
    })
  ).current;

  const selectedPoint =
    selectedIndex != null && points[selectedIndex] ? points[selectedIndex] : null;

  const horizontalGuides = 4;
  const yGuideValues = Array.from({ length: horizontalGuides + 1 }, (_, i) => {
    const ratio = i / horizontalGuides;
    const price = maxPrice - (maxPrice - minPrice) * ratio;
    const y = paddingTop + chartHeight * ratio;
    return { y, price: Math.round(price) };
  });

  return (
    <View
      style={{
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#F0F0F0",
        overflow: "hidden",
      }}
    >
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          {yGuideValues.map((guide, index) => (
            <Line
              key={`guide-${index}`}
              x1={paddingLeft}
              y1={guide.y}
              x2={width - paddingRight}
              y2={guide.y}
              stroke="#ECECEC"
              strokeWidth="1"
            />
          ))}

          <Path d={pathD} fill="none" stroke="#111111" strokeWidth={2.5} />

          {selectedPoint ? (
            <>
              <Line
                x1={selectedPoint.x}
                y1={paddingTop}
                x2={selectedPoint.x}
                y2={paddingTop + chartHeight}
                stroke="#D1D5DB"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <Circle
                cx={selectedPoint.x}
                cy={selectedPoint.y}
                r="5"
                fill="#FFFFFF"
                stroke="#111111"
                strokeWidth="2"
              />
            </>
          ) : null}
        </Svg>

        <View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width,
            height,
          }}
        />

        {selectedPoint ? (() => {
          const tooltipWidth = 124;
          const tooltipHeight = 58;

          let left = selectedPoint.x - tooltipWidth / 2;
          let top = selectedPoint.y - tooltipHeight - 14;

          if (left < 8) left = 8;
          if (left + tooltipWidth > width - 8) left = width - tooltipWidth - 8;
          if (top < 8) top = selectedPoint.y + 16;

          return (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left,
                top,
                width: tooltipWidth,
                backgroundColor: "#111111",
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: "#FFFFFF",
                  fontSize: 10,
                  marginBottom: 4,
                }}
              >
                {selectedPoint.label}
              </Text>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                {formatPrice(selectedPoint.price)}
              </Text>
            </View>
          );
        })() : null}

        <View
          style={{
            position: "absolute",
            left: paddingLeft,
            right: paddingRight,
            bottom: 8,
            height: 14,
          }}
        >
          {data.map((point, index) => {
            const shouldShow =
              index === 0 || index === data.length - 1 || index % 2 === 0;

            return (
              <Text
                key={`${point.label}-${index}`}
                style={{
                  position: "absolute",
                  left: getX(index) - 28,
                  width: 56,
                  textAlign: "center",
                  fontSize: 10,
                  color: "#7A7A7A",
                }}
                numberOfLines={1}
              >
                {shouldShow ? point.label : ""}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function ProductDetailScreen({ route }: Props) {
  const { item } = route.params;

  const compareItems = mockCompareMap[item.id] ?? [];
  const priceHistory = mockPriceHistoryMap[item.id] ?? [];
  const [couponInputs, setCouponInputs] = useState<Record<string, string>>({});

  const compareItemsWithDiscount = useMemo(() => {
    return compareItems.map((siteItem) => {
      const rawInput = couponInputs[siteItem.site];
      const parsedCoupon =
        rawInput && rawInput.trim() !== "" ? Number(rawInput) : null;

      const safeCoupon =
        parsedCoupon != null &&
        Number.isFinite(parsedCoupon) &&
        parsedCoupon >= 0 &&
        parsedCoupon <= 100
          ? parsedCoupon
          : null;

      const discountedPrice = siteItem.supportsCoupon
        ? getDiscountedPrice(siteItem.price, safeCoupon)
        : siteItem.price;

      return {
        ...siteItem,
        enteredCouponPercent: safeCoupon,
        discountedPrice,
      };
    });
  }, [compareItems, couponInputs]);

  const cheapestItem = useMemo(() => {
    const valid = compareItemsWithDiscount.filter((site) => site.price != null);
    if (valid.length === 0) return null;

    return valid.reduce((min, cur) => {
      if ((cur.price ?? Infinity) < (min.price ?? Infinity)) return cur;
      return min;
    });
  }, [compareItemsWithDiscount]);

  const cheapestDiscountedItem = useMemo(() => {
    const valid = compareItemsWithDiscount.filter((site) => site.discountedPrice != null);
    if (valid.length === 0) return null;

    return valid.reduce((min, cur) => {
      if ((cur.discountedPrice ?? Infinity) < (min.discountedPrice ?? Infinity)) {
        return cur;
      }
      return min;
    });
  }, [compareItemsWithDiscount]);

  const prices = priceHistory.map((point) => point.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const avgPrice =
    prices.length > 0
      ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
      : null;

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 64;
  const statusPill = getStatusPill(item);

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("오류", "링크를 열 수 없어요.");
    }
  }

  function handleCouponChange(site: string, value: string) {
    const numericOnly = value.replace(/[^0-9]/g, "");
    setCouponInputs((prev) => ({
      ...prev,
      [site]: numericOnly,
    }));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
        <Card style={{ padding: 18 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                width: 116,
                height: 116,
                borderRadius: 22,
                backgroundColor: "#F2F3F5",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: COLORS.border,
                marginRight: 16,
                flexShrink: 0,
              }}
            >
              <Text style={{ color: COLORS.muted, fontSize: 12, textAlign: "center" }}>
                이미지{"\n"}없음
              </Text>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              {item.brand ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: COLORS.subText,
                    marginBottom: 6,
                  }}
                >
                  {item.brand}
                </Text>
              ) : null}

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: COLORS.text,
                  lineHeight: 31,
                  marginBottom: 10,
                }}
              >
                {item.name ?? "이름 없음"}
              </Text>

              <View
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: statusPill.bg,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: statusPill.color,
                  }}
                >
                  {statusPill.text}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              marginTop: 16,
              borderTopWidth: 1,
              borderTopColor: "#F0F2F5",
              paddingTop: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.subText, marginBottom: 6 }}>
              현재 추적 가격
            </Text>
            <Text style={{ fontSize: 30, fontWeight: "800", color: COLORS.text }}>
              {formatPrice(item.currentPrice)}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.subText, marginTop: 8 }}>
              {getChangeDisplay(item)}
            </Text>
          </View>
        </Card>

        <Card>
          <SectionTitle
            eyebrow="핵심 요약"
            title="지금 가장 유리한 가격"
            description="현재가와 최저가, 쿠폰 적용 시 실구매가를 한 번에 비교할 수 있어요."
          />

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <MetricBox
              label="현재가"
              value={formatPrice(item.currentPrice)}
              subValue={getChangeDisplay(item)}
            />
            <MetricBox
              label="현재 최저가"
              value={cheapestItem ? formatPrice(cheapestItem.price) : "-"}
              subValue={cheapestItem ? cheapestItem.siteLabel : "비교 데이터 없음"}
              accent="blue"
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <MetricBox
              label="쿠폰 적용 최저가"
              value={
                cheapestDiscountedItem
                  ? formatPrice(cheapestDiscountedItem.discountedPrice)
                  : "-"
              }
              subValue={
                cheapestDiscountedItem
                  ? cheapestDiscountedItem.siteLabel
                  : "입력된 쿠폰 기준 데이터 없음"
              }
              accent="green"
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            {cheapestItem ? (
              <Pressable
                onPress={() => openLink(cheapestItem.url)}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.black,
                  borderRadius: 12,
                  paddingVertical: 13,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                  최저가 바로가기
                </Text>
              </Pressable>
            ) : null}

            {cheapestDiscountedItem ? (
              <Pressable
                onPress={() => openLink(cheapestDiscountedItem.url)}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 12,
                  paddingVertical: 13,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: "700" }}>
                  쿠폰 최저가 보기
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Card>

        <Card>
          <SectionTitle
            eyebrow="가격 흐름"
            title="최근 3개월 가격 변화"
            description="차트 위를 누르거나 드래그하면 해당 날짜의 가격을 바로 확인할 수 있어요."
          />

          {priceHistory.length > 0 ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FAFAFA",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#F0F0F0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 4 }}>
                    3개월 최저가
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.text }}>
                    {formatPrice(minPrice)}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FAFAFA",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#F0F0F0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 4 }}>
                    3개월 최고가
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.text }}>
                    {formatPrice(maxPrice)}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#FAFAFA",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#F0F0F0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 4 }}>
                    3개월 평균가
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.text }}>
                    {formatPrice(avgPrice)}
                  </Text>
                </View>
              </View>

              <InteractivePriceChart
                data={priceHistory}
                width={chartWidth}
                height={250}
              />
            </>
          ) : (
            <View
              style={{
                height: 150,
                borderRadius: 12,
                backgroundColor: "#F7F7F7",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: "#666666", textAlign: "center", lineHeight: 20 }}>
                가격 히스토리 데이터가 아직 없어요.
              </Text>
            </View>
          )}
        </Card>

        <Card>
          <SectionTitle
            eyebrow="가격 비교"
            title="쇼핑몰별 구매 조건 비교"
            description="기본 최저가와 쿠폰 적용 최저가를 기준으로 가장 유리한 구매처를 고를 수 있어요."
          />

          {compareItemsWithDiscount.map((siteItem) => {
            const isCheapest = cheapestItem?.site === siteItem.site;
            const isDiscountCheapest = cheapestDiscountedItem?.site === siteItem.site;

            const hasCouponApplied =
              siteItem.supportsCoupon &&
              siteItem.enteredCouponPercent != null &&
              siteItem.enteredCouponPercent > 0 &&
              siteItem.discountedPrice != null &&
              siteItem.price != null &&
              siteItem.discountedPrice < siteItem.price;

            return (
              <View
                key={siteItem.site}
                style={{
                  borderWidth: 1,
                  borderColor: isDiscountCheapest
                    ? "#CFE8D6"
                    : isCheapest
                    ? "#D8E5FF"
                    : "#EEEEEE",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                  backgroundColor: isDiscountCheapest
                    ? "#F7FCF8"
                    : isCheapest
                    ? "#F7FAFF"
                    : "#FFFFFF",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>
                        {siteItem.siteLabel}
                      </Text>

                      {isCheapest ? (
                        <View
                          style={{
                            marginLeft: 6,
                            backgroundColor: COLORS.blue,
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            borderRadius: 7,
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>
                            기본 최저가
                          </Text>
                        </View>
                      ) : null}

                      {isDiscountCheapest ? (
                        <View
                          style={{
                            marginLeft: 6,
                            backgroundColor: COLORS.green,
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            borderRadius: 7,
                          }}
                        >
                          <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>
                            쿠폰 최저가
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={{ fontSize: 12, color: COLORS.subText, lineHeight: 18 }}>
                      {siteItem.couponText ?? "쿠폰 정보 없음"}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    {hasCouponApplied ? (
                      <>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#8A8A8A",
                            textDecorationLine: "line-through",
                            marginBottom: 4,
                          }}
                        >
                          {formatPrice(siteItem.price)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "800",
                            color: COLORS.text,
                          }}
                        >
                          {formatPrice(siteItem.discountedPrice)}
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "800",
                          color: COLORS.text,
                        }}
                      >
                        {formatPrice(siteItem.price)}
                      </Text>
                    )}
                  </View>
                </View>

                {siteItem.supportsCoupon ? (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 6 }}>
                      쿠폰 입력
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor:
                          couponInputs[siteItem.site] && couponInputs[siteItem.site] !== ""
                            ? "#111111"
                            : "#E3E3E3",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <TextInput
                        value={couponInputs[siteItem.site] ?? ""}
                        onChangeText={(value) => handleCouponChange(siteItem.site, value)}
                        placeholder="예: 10"
                        placeholderTextColor="#B8B8B8"
                        keyboardType="numeric"
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          fontSize: 14,
                          color: "#111111",
                        }}
                      />
                      <Text style={{ color: "#777777", fontSize: 14 }}>%</Text>
                    </View>

                    <Text
                      style={{
                        fontSize: 11,
                        color: "#888888",
                        marginTop: 4,
                      }}
                    >
                      입력한 쿠폰 기준으로 실구매가가 계산돼요.
                    </Text>
                  </View>
                ) : null}

                <View
                  style={{
                    borderRadius: 12,
                    backgroundColor: "#FAFAFA",
                    padding: 10,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#F0F0F0",
                  }}
                >
                  {hasCouponApplied ? (
                    <>
                      <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 4 }}>
                        현재 가격
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#8A8A8A",
                          textDecorationLine: "line-through",
                          marginBottom: 8,
                        }}
                      >
                        {formatPrice(siteItem.price)}
                      </Text>

                      <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 4 }}>
                        쿠폰 적용가
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.text }}>
                        {formatPrice(siteItem.discountedPrice)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 4 }}>
                        현재 가격
                      </Text>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: COLORS.text }}>
                        {formatPrice(siteItem.price)}
                      </Text>
                    </>
                  )}
                </View>

                <Pressable
                  onPress={() => openLink(siteItem.url)}
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: isDiscountCheapest
                      ? COLORS.green
                      : isCheapest
                      ? COLORS.blue
                      : "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: isDiscountCheapest || isCheapest ? "#FFFFFF" : "#333333",
                    }}
                  >
                    구매하러 가기
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </Card>

        <Card style={{ marginBottom: 18 }}>
          <SectionTitle
            eyebrow="추적 정보"
            title="상품 추적 메타데이터"
            description="구매 판단에는 덜 중요하지만 추적 상태를 확인할 때 필요한 정보예요."
          />

          <View
            style={{
              borderRadius: 12,
              backgroundColor: "#FAFAFA",
              borderWidth: 1,
              borderColor: "#F0F0F0",
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.text, marginBottom: 8 }}>
              마지막 확인: {formatDateTime(item.lastCheckedAt)}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.text }}>
              등록일: {formatDateTime(item.createdAt)}
            </Text>
          </View>
        </Card>

        <Pressable
          onPress={() => openLink(item.url)}
          style={{
            backgroundColor: COLORS.black,
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
            원본 상품 보러가기
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}