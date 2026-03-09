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
import { mockTrackedListings } from "../mock/trackedListings";
import type { TrackedListing } from "../types/trackedListing";
import {
  filterTrackedListings,
  formatPrice,
  getChangeDisplay,
  getChangeLabel,
  getChangeType,
  sortTrackedListings,
} from "../utils/trackedListing";

type Props = NativeStackScreenProps<RootStackParamList, "TrackedProducts">;
type FilterType = "all" | "price_drop" | "restocked" | "sold_out";

function getStatusStyle(changeType: ReturnType<typeof getChangeType>) {
  switch (changeType) {
    case "price_drop":
      return {
        backgroundColor: "#EEF6FF",
        textColor: "#2563EB",
      };
    case "restocked":
      return {
        backgroundColor: "#ECFDF3",
        textColor: "#16A34A",
      };
    case "sold_out":
      return {
        backgroundColor: "#F5F5F5",
        textColor: "#666666",
      };
    case "price_up":
      return {
        backgroundColor: "#FFF1F2",
        textColor: "#E11D48",
      };
    default:
      return {
        backgroundColor: "#F5F5F5",
        textColor: "#444444",
      };
  }
}

function getChangeDotColor(changeType: ReturnType<typeof getChangeType>) {
  switch (changeType) {
    case "price_drop":
      return "#2563EB";
    case "restocked":
      return "#16A34A";
    case "price_up":
      return "#E11D48";
    default:
      return null;
  }
}

function getColumnCount(width: number) {
  if (Platform.OS !== "web") return 2;
  if (width >= 1400) return 5;
  if (width >= 1100) return 4;
  if (width >= 800) return 3;
  return 2;
}

export default function TrackedProductsScreen({ navigation }: Props) {
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [items, setItems] = useState<TrackedListing[]>(mockTrackedListings);

  const { width } = useWindowDimensions();
  const columnCount = getColumnCount(width);

  const gap = Platform.OS === "web" ? 12 : 10;
  const horizontalPadding = 28;
  const totalGap = gap * (columnCount - 1);
  const cardWidth = (width - horizontalPadding - totalGap) / columnCount;

  const visibleItems = useMemo(() => {
    const filtered = filterTrackedListings(items, filter, searchText);
    return sortTrackedListings(filtered);
  }, [items, filter, searchText]);

  function togglePin(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  }

  function renderFilterButton(value: FilterType, label: string) {
    const selected = filter === value;

    return (
      <Pressable
        key={value}
        onPress={() => setFilter(value)}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected ? "#111" : "#E2E2E2",
          backgroundColor: selected ? "#111" : "#FFF",
          marginRight: 8,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: selected ? "#FFF" : "#333",
            fontWeight: "600",
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
    const dotColor = getChangeDotColor(changeType);

    return (
      <Pressable
        key={item.id}
        onPress={() => navigation.navigate("ProductDetail", { item })}
        style={{
          width: cardWidth,
          borderWidth: 1,
          borderColor: "#ECECEC",
          borderRadius: 12,
          padding: 8,
          backgroundColor: "#FFF",
          marginBottom: gap,
          position: "relative",
        }}
      >
        <Pressable
          onPress={() => togglePin(item.id)}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 3,
            width: 22,
            height: 22,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFF",
            borderWidth: 1,
            borderColor: "#F0F0F0",
          }}
        >
          <Text style={{ fontSize: 13 }}>{item.isPinned ? "★" : "☆"}</Text>
        </Pressable>

        <View
          style={{
            width: "100%",
            height: cardWidth * 0.65,
            borderRadius: 8,
            backgroundColor: "#F5F5F5",
            borderWidth: 1,
            borderColor: "#EAEAEA",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {dotColor ? (
            <View
              style={{
                position: "absolute",
                top: 7,
                left: 7,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: dotColor,
              }}
            />
          ) : null}

          <Text style={{ fontSize: 11, color: "#999" }}>이미지 없음</Text>
        </View>

        <Text
          numberOfLines={2}
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: "#111",
            lineHeight: 16,
            minHeight: 32,
            marginBottom: 6,
            paddingRight: 22,
          }}
        >
          {item.name ?? "이름 없음"}
        </Text>

        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#111",
            marginBottom: 2,
          }}
        >
          {formatPrice(item.currentPrice)}
        </Text>

        <Text
          numberOfLines={1}
          style={{
            fontSize: 10,
            color: "#666",
            marginBottom: 6,
            lineHeight: 13,
          }}
        >
          {getChangeDisplay(item)}
        </Text>

        <View
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: statusStyle.backgroundColor,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              color: statusStyle.textColor,
              fontWeight: "600",
            }}
          >
            {getChangeLabel(item)}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 14,
          paddingBottom: 24,
        }}
      >
        <View
          style={{
            marginBottom: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111" }}>
              추적 상품
            </Text>
            <Text style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
              가격과 재고 변화를 빠르게 확인하세요
            </Text>
          </View>

          <Pressable
            onPress={() => navigation.navigate("AddProduct")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: "#111",
            }}
          >
            <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 12 }}>
              + 상품 추가
            </Text>
          </Pressable>
        </View>

        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="상품 검색"
          style={{
            borderWidth: 1,
            borderColor: "#E2E2E2",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 14,
            marginBottom: 10,
          }}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
        >
          {renderFilterButton("all", "전체")}
          {renderFilterButton("price_drop", "가격하락")}
          {renderFilterButton("restocked", "재입고")}
          {renderFilterButton("sold_out", "품절")}
        </ScrollView>

        {visibleItems.length === 0 ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#EEE",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FAFAFA",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111",
                marginBottom: 8,
              }}
            >
              표시할 상품이 없어요
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: "#777",
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 14,
              }}
            >
              검색어나 필터를 바꿔보거나 새로운 상품을 추가해보세요.
            </Text>

            <Pressable
              onPress={() => navigation.navigate("AddProduct")}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: "#111",
              }}
            >
              <Text style={{ color: "#FFF", fontWeight: "600" }}>
                상품 추가하기
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: gap,
            }}
          >
            {visibleItems.map(renderCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}