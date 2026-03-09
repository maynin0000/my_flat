import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import type { RootStackParamList } from "../../App";
import { mockCompareMap } from "../mock/priceCompare";
import { mockPriceHistoryMap } from "../mock/priceHistory";
import { formatPrice, getChangeDisplay, getChangeLabel } from "../utils/trackedListing";

type Props = NativeStackScreenProps<RootStackParamList, "ProductDetail">;

export default function ProductDetailScreen({ route }: Props) {
  const { item } = route.params;

  const compareItems = mockCompareMap[item.id] ?? [];
  const priceHistory = mockPriceHistoryMap[item.id] ?? [];

  const cheapestItem = useMemo(() => {
    const valid = compareItems.filter((site) => site.price != null);
    if (valid.length === 0) return null;

    return valid.reduce((min, cur) => {
      if ((cur.price ?? Infinity) < (min.price ?? Infinity)) return cur;
      return min;
    });
  }, [compareItems]);

  const prices = priceHistory.map((point) => point.price);

  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const avgPrice =
    prices.length > 0
      ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
      : null;

  const chartWidth = Math.min(Dimensions.get("window").width - 64, 420);

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("오류", "링크를 열 수 없어요.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View
          style={{
            width: 220,
            aspectRatio: 1,
            alignSelf: "center",
            borderRadius: 18,
            backgroundColor: "#f3f3f3",
            marginBottom: 20,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#ececec",
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ color: "#999", fontSize: 13 }}>이미지 없음</Text>
        </View>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#111",
            marginBottom: 8,
          }}
        >
          {item.name ?? "이름 없음"}
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 13, color: "#777", marginBottom: 6 }}>
            현재 추적 가격
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#111" }}>
            {formatPrice(item.currentPrice)}
          </Text>
          <Text style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
            {getChangeDisplay(item)} · {getChangeLabel(item)}
          </Text>
        </View>

        {cheapestItem ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#e7eefc",
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              backgroundColor: "#f8fbff",
            }}
          >
            <Text style={{ fontSize: 13, color: "#5b6b85", marginBottom: 6 }}>
              현재 최저가
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#111" }}>
              {formatPrice(cheapestItem.price)}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#444",
                marginTop: 4,
                marginBottom: 12,
              }}
            >
              {cheapestItem.siteLabel}
            </Text>

            <Pressable
              onPress={() => openLink(cheapestItem.url)}
              style={{
                backgroundColor: "#111",
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                최저가 바로가기
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>
            최근 3개월 가격 변화
          </Text>

          {priceHistory.length > 0 ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: "#fafafa",
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#f0f0f0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>
                    3개월 최저가
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
                    {formatPrice(minPrice)}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: "#fafafa",
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#f0f0f0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>
                    3개월 최고가
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
                    {formatPrice(maxPrice)}
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    backgroundColor: "#fafafa",
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#f0f0f0",
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>
                    3개월 평균가
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#111" }}>
                    {formatPrice(avgPrice)}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  alignItems: "center",
                  backgroundColor: "#fafafa",
                  borderRadius: 12,
                  paddingVertical: 12,
                  overflow: "hidden",
                }}
              >
                <LineChart
                  data={{
                    labels: priceHistory.map((point) => point.label),
                    datasets: [
                      {
                        data: priceHistory.map((point) => point.price),
                      },
                    ],
                  }}
                  width={chartWidth}
                  height={200}
                  yAxisSuffix="원"
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines
                  fromZero={false}
                  chartConfig={{
                    backgroundColor: "#fafafa",
                    backgroundGradientFrom: "#fafafa",
                    backgroundGradientTo: "#fafafa",
                    decimalPlaces: 0,
                    color: () => "#111",
                    labelColor: () => "#666",
                    propsForDots: {
                      r: "3",
                      strokeWidth: "2",
                      stroke: "#111",
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: "",
                      stroke: "#ececec",
                    },
                  }}
                  style={{
                    borderRadius: 12,
                  }}
                />
              </View>
            </>
          ) : (
            <View
              style={{
                height: 150,
                borderRadius: 12,
                backgroundColor: "#f7f7f7",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: "#666", textAlign: "center", lineHeight: 20 }}>
                가격 히스토리 데이터가 아직 없어요.
              </Text>
            </View>
          )}
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 16,
            marginBottom: 14,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 13, color: "#777", marginBottom: 12 }}>
            사이트별 가격 비교
          </Text>

          {compareItems.map((siteItem) => {
            const isCheapest = cheapestItem?.site === siteItem.site;

            return (
              <View
                key={siteItem.site}
                style={{
                  borderWidth: 1,
                  borderColor: isCheapest ? "#2563EB" : "#f0f0f0",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  backgroundColor: isCheapest ? "#F0F6FF" : "#fff",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#111" }}>
                      {siteItem.siteLabel}
                    </Text>

                    {isCheapest && (
                      <View
                        style={{
                          marginLeft: 6,
                          backgroundColor: "#2563EB",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          최저가
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#111" }}>
                    {formatPrice(siteItem.price)}
                  </Text>
                </View>

                <Text style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                  {siteItem.couponText ?? "쿠폰 정보 없음"}
                </Text>

                <Pressable
                  onPress={() => openLink(siteItem.url)}
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 8,
                    backgroundColor: isCheapest ? "#2563EB" : "#f3f3f3",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isCheapest ? "#fff" : "#333",
                    }}
                  >
                    구매하러 가기
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 16,
            marginBottom: 18,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 13, color: "#777", marginBottom: 10 }}>
            추적 정보
          </Text>

          <Text style={{ fontSize: 13, color: "#333", marginBottom: 6 }}>
            마지막 확인: {item.lastCheckedAt}
          </Text>
          <Text style={{ fontSize: 13, color: "#333" }}>
            등록일: {item.createdAt}
          </Text>
        </View>

        <Pressable
          onPress={() => openLink(item.url)}
          style={{
            backgroundColor: "#111",
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
            원본 상품 보러가기
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}