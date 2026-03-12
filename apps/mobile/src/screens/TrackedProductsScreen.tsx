import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import type { RootStackParamList } from "../../App";
import { mockCompareMap } from "../mock/priceCompare";
import { mockTrackedListings } from "../mock/trackedListings";
import type { ComparePriceItem } from "../types/priceCompare";
import type { TrackedListing } from "../types/trackedListing";
import {
  formatPrice,
  getChangeDisplay,
  getChangeLabel,
  getChangeType,
  sortTrackedListings,
} from "../utils/trackedListing";

type Props = NativeStackScreenProps<RootStackParamList, "TrackedProducts">;

type FilterType =
  | "all"
  | "price_drop"
  | "restocked"
  | "sold_out"
  | "favorite";

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
  purpleSoft: "#EEF2FF",
  purple: "#4338CA",
  yellowSoft: "#FFF7DB",
  yellowBorder: "#F3D36B",
};

function getColumnCount(width: number) {
  if (Platform.OS !== "web") {
    if (width < 520) return 1;
    return 2;
  }

  if (width >= 1480) return 4;
  if (width >= 1120) return 3;
  if (width >= 760) return 2;
  return 1;
}

function formatCheckedAt(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "확인 기록 없음";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${month}.${day} ${hour}:${minute} 확인`;
}

function countInStockSizes(item: TrackedListing) {
  return Object.values(item.sizes).filter((value) => value === "in_stock").length;
}

function getStatusStyle(changeType: ReturnType<typeof getChangeType>) {
  switch (changeType) {
    case "price_drop":
      return {
        backgroundColor: COLORS.blueSoft,
        textColor: COLORS.blue,
      };
    case "restocked":
      return {
        backgroundColor: COLORS.greenSoft,
        textColor: COLORS.green,
      };
    case "sold_out":
      return {
        backgroundColor: COLORS.graySoft,
        textColor: "#6B7280",
      };
    case "price_up":
      return {
        backgroundColor: COLORS.redSoft,
        textColor: COLORS.red,
      };
    default:
      return {
        backgroundColor: COLORS.graySoft,
        textColor: "#6B7280",
      };
  }
}

function getChangeAccent(item: TrackedListing) {
  const changeType = getChangeType(item);

  switch (changeType) {
    case "price_drop":
      return {
        color: COLORS.blue,
        bg: COLORS.blueSoft,
        text: getChangeDisplay(item),
      };
    case "price_up":
      return {
        color: COLORS.red,
        bg: COLORS.redSoft,
        text: getChangeDisplay(item),
      };
    case "restocked":
      return {
        color: COLORS.green,
        bg: COLORS.greenSoft,
        text: "재입고 확인",
      };
    case "sold_out":
      return {
        color: "#6B7280",
        bg: COLORS.graySoft,
        text: "현재 품절",
      };
    default:
      return {
        color: "#6B7280",
        bg: COLORS.graySoft,
        text: "변동 없음",
      };
  }
}

function getLowestPriceSite(compareItems: ComparePriceItem[] | undefined) {
  if (!compareItems || compareItems.length === 0) return null;

  const valid = compareItems.filter((siteItem) => siteItem.price != null);
  if (valid.length === 0) return null;

  return valid.reduce((min, cur) => {
    if ((cur.price ?? Infinity) < (min.price ?? Infinity)) return cur;
    return min;
  });
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
        minWidth: 84,
      }}
    >
      <Text style={{ fontSize: 11, color: COLORS.subText, marginBottom: 3 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>
        {value}
      </Text>
    </View>
  );
}

function ThumbnailPlaceholder() {
  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          lineHeight: 13,
          color: COLORS.muted,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        이미지{"\n"}없음
      </Text>
    </View>
  );
}

export default function TrackedProductsScreen({ navigation }: Props) {
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [items, setItems] = useState<TrackedListing[]>(mockTrackedListings);

  const { width } = useWindowDimensions();
  const columnCount = getColumnCount(width);

  const pagePadding = 14;
  const gap = 12;
  const totalGap = gap * (columnCount - 1);
  const availableWidth = width - pagePadding * 2 - totalGap;
  const rawCardWidth = availableWidth / columnCount;
  const cardWidth = Platform.OS === "web" ? Math.min(420, rawCardWidth) : rawCardWidth;

  const summary = useMemo(() => {
    return {
      total: items.length,
      favorite: items.filter((item) => item.isPinned).length,
      priceDrop: items.filter((item) => getChangeType(item) === "price_drop").length,
      restocked: items.filter((item) => getChangeType(item) === "restocked").length,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    const searched = items.filter((item) => {
      if (!keyword) return true;

      const compareItems = mockCompareMap[item.id] ?? [];
      const lowestSite = getLowestPriceSite(compareItems);

      const target = [
        item.name ?? "",
        item.brand ?? "",
        lowestSite?.siteLabel ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return target.includes(keyword);
    });

    const filtered = searched.filter((item) => {
      const changeType = getChangeType(item);

      switch (filter) {
        case "price_drop":
          return changeType === "price_drop";
        case "restocked":
          return changeType === "restocked";
        case "sold_out":
          return changeType === "sold_out";
        case "favorite":
          return item.isPinned;
        case "all":
        default:
          return true;
      }
    });

    return sortTrackedListings(filtered);
  }, [items, filter, searchText]);

  function toggleFavorite(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  }

  function renderFilterChip(value: FilterType, label: string) {
    const selected = filter === value;

    return (
      <Pressable
        key={value}
        onPress={() => setFilter(value)}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? COLORS.black : COLORS.border,
          backgroundColor: selected ? COLORS.black : COLORS.surface,
          marginRight: 8,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: selected ? "#FFFFFF" : "#374151",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  }

  function renderCard(item: TrackedListing) {
    const changeType = getChangeType(item);
    const statusStyle = getStatusStyle(changeType);
    const accent = getChangeAccent(item);
    const inStockCount = countInStockSizes(item);
    const compareItems = mockCompareMap[item.id] ?? [];
    const lowestSite = getLowestPriceSite(compareItems);

    return (
      <Pressable
        key={item.id}
        onPress={() => navigation.navigate("ProductDetail", { item })}
        style={{
          width: cardWidth,
          minHeight: 138,
          borderRadius: 18,
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          padding: 12,
          marginBottom: gap,
          shadowColor: "#000",
          shadowOpacity: Platform.OS === "web" ? 0.04 : 0.03,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: Platform.OS === "web" ? 0 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <ThumbnailPlaceholder />

          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {item.brand ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: COLORS.text,
                      marginRight: 8,
                    }}
                  >
                    {item.brand}
                  </Text>
                ) : null}

                {lowestSite ? (
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: COLORS.purpleSoft,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: COLORS.purple,
                        letterSpacing: 0.1,
                      }}
                    >
                      최저가 {lowestSite.siteLabel}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={(event) => {
                  event.stopPropagation?.();
                  toggleFavorite(item.id);
                }}
                hitSlop={8}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: item.isPinned ? COLORS.yellowSoft : "#F8FAFC",
                  borderWidth: 1,
                  borderColor: item.isPinned ? COLORS.yellowBorder : COLORS.border,
                  marginLeft: 10,
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontSize: 14 }}>{item.isPinned ? "★" : "☆"}</Text>
              </Pressable>
            </View>

            <Text
              numberOfLines={2}
              style={{
                fontSize: 13,
                lineHeight: 18,
                fontWeight: "700",
                color: COLORS.text,
                marginBottom: 8,
                minHeight: 36,
              }}
            >
              {item.name ?? "이름 없음"}
            </Text>

            <View
              style={{
                flexDirection: width < 520 ? "column" : "row",
                alignItems: width < 520 ? "flex-start" : "center",
                justifyContent: "space-between",
                marginBottom: 7,
                gap: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 19,
                  fontWeight: "800",
                  color: COLORS.text,
                  letterSpacing: -0.3,
                }}
              >
                {formatPrice(item.currentPrice)}
              </Text>

              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: accent.bg,
                  maxWidth: "100%",
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: accent.color,
                  }}
                >
                  {accent.text}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 7,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: statusStyle.backgroundColor,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "800",
                    color: statusStyle.textColor,
                  }}
                >
                  {getChangeLabel(item)}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 11,
                  color: COLORS.subText,
                  fontWeight: "600",
                }}
              >
                재고 {inStockCount}개
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: COLORS.subText,
                }}
              >
                {item.previousPrice != null
                  ? `이전 ${formatPrice(item.previousPrice)}`
                  : "이전 가격 없음"}
              </Text>

              <Text
                numberOfLines={1}
                style={{
                  fontSize: 10,
                  color: COLORS.muted,
                }}
              >
                {formatCheckedAt(item.lastCheckedAt)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: pagePadding,
          paddingTop: 14,
          paddingBottom: 28,
        }}
      >
        <View
          style={{
            borderRadius: 20,
            backgroundColor: COLORS.surface,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              flexDirection: width < 620 ? "column" : "row",
              justifyContent: "space-between",
              alignItems: width < 620 ? "stretch" : "center",
              marginBottom: 14,
              gap: 12,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: COLORS.text,
                  letterSpacing: -0.3,
                }}
              >
                추적 상품
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: COLORS.subText,
                  marginTop: 5,
                }}
              >
                가격 하락, 재입고, 즐겨찾기, 최저가 쇼핑몰을 빠르게 확인하세요
              </Text>
            </View>

            <Pressable
              onPress={() => navigation.navigate("AddProduct")}
              style={{
                backgroundColor: COLORS.black,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
                + 상품 추가
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            contentContainerStyle={{ paddingRight: 8 }}
          >
            <SummaryChip label="전체 추적" value={summary.total} />
            <SummaryChip label="가격 하락" value={summary.priceDrop} />
            <SummaryChip label="재입고" value={summary.restocked} />
            <SummaryChip label="즐겨찾기" value={summary.favorite} />
          </ScrollView>

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="상품명, 브랜드, 최저가 쇼핑몰 검색"
            placeholderTextColor="#9CA3AF"
            style={{
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: COLORS.text,
            }}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 14 }}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          {renderFilterChip("all", "전체")}
          {renderFilterChip("price_drop", "가격 하락")}
          {renderFilterChip("restocked", "재입고")}
          {renderFilterChip("sold_out", "품절")}
          {renderFilterChip("favorite", "즐겨찾기")}
        </ScrollView>

        {visibleItems.length === 0 ? (
          <View
            style={{
              borderRadius: 18,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: COLORS.text,
                marginBottom: 8,
              }}
            >
              표시할 상품이 없어요
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: COLORS.subText,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              검색어나 필터를 바꾸거나
              {"\n"}
              새로운 상품을 추가해보세요.
            </Text>

            <Pressable
              onPress={() => navigation.navigate("AddProduct")}
              style={{
                backgroundColor: COLORS.black,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                상품 추가하기
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap,
              justifyContent: Platform.OS === "web" ? "flex-start" : undefined,
            }}
          >
            {visibleItems.map(renderCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}