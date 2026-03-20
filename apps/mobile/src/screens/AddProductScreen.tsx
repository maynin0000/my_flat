import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "../constants/theme";
import { useTrackedItems } from "../context/TrackedItemsContext";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "AddProduct">;

type AddMode = "search" | "link";

type SearchResultItem = {
  id: string;
  mall: "official" | "musinsa" | "kream" | "29cm";
  mallLabel: string;
  name: string;
  price: number;
  imageText: string;
  url: string;
};

// 원본: 검색용 Mock 데이터 유지
const MOCK_SEARCH_RESULTS: SearchResultItem[] = [
  { id: "sr1", mall: "official", mallLabel: "공식몰", name: "나이키 V2K 런 서밋 화이트 메탈릭 실버", price: 129000, imageText: "공식몰\n이미지", url: "https://www.nike.com/kr/t/v2k-run-shoes-example" },
  { id: "sr2", mall: "musinsa", mallLabel: "무신사", name: "나이키 V2K 런 화이트 실버", price: 124000, imageText: "무신사\n이미지", url: "https://www.musinsa.com/products/example-v2k-run" },
  { id: "sr3", mall: "kream", mallLabel: "크림", name: "Nike V2K Run Summit White Metallic Silver", price: 132000, imageText: "크림\n이미지", url: "https://kream.co.kr/products/example-v2k-run" },
  { id: "sr4", mall: "29cm", mallLabel: "29CM", name: "나이키 V2K 런 스니커즈 화이트", price: 127000, imageText: "29CM\n이미지", url: "https://www.29cm.co.kr/product/example-v2k-run" },
];

function normalizeUrl(input: string): string | null {
  const u = input.trim();
  if (!u) return null;
  const withScheme = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  try { return new URL(withScheme).toString(); } catch { return null; }
}

function detectMallLabel(url: string | null) {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes("musinsa")) return "무신사";
  if (lower.includes("kream")) return "크림";
  if (lower.includes("29cm")) return "29CM";
  if (lower.includes("nike") || lower.includes("adidas") || lower.includes("newbalance") || lower.includes("shop")) return "공식몰";
  return "외부 쇼핑몰";
}

function formatPrice(value: number) { return `${value.toLocaleString("ko-KR")}원`; }
function mapMallToSite(mall: string) {
  if (mall.includes('무신사') || mall === 'musinsa') return 'musinsa';
  if (mall.includes('크림') || mall === 'kream') return 'kream';
  if (mall.includes('29CM') || mall === '29cm') return '29cm';
  return 'official';
}

function SectionCard({ children, style }: any) { return <View style={[{ backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 16, marginBottom: 14 }, style]}>{children}</View>; }
function SupportChip({ label }: { label: string }) { return <View style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: COLORS.border, marginRight: 8, marginBottom: 8 }}><Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.text }}>{label}</Text></View>; }
function TabButton({ label, selected, onPress }: any) { return <Pressable onPress={onPress} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: selected ? COLORS.black : "#F3F4F6", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 13, fontWeight: "700", color: selected ? "#FFFFFF" : COLORS.text }}>{label}</Text></Pressable>; }

function SearchResultCard({ item, selected, onToggle }: any) {
  return (
    <Pressable onPress={onToggle} style={{ borderWidth: 1.5, borderColor: selected ? "#CFE0FF" : COLORS.border, backgroundColor: selected ? "#F7FAFF" : "#FFFFFF", borderRadius: 20, padding: 12, marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ width: 70, height: 70, borderRadius: 14, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
          <Text style={{ fontSize: 10, lineHeight: 13, color: COLORS.muted, textAlign: "center", fontWeight: "600" }}>{item.imageText}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
            <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: COLORS.purpleSoft }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: COLORS.purple }}>{item.mallLabel}</Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: selected ? COLORS.black : "#F3F4F6" }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: selected ? "#FFFFFF" : COLORS.text }}>{selected ? "선택됨 ✓" : "선택"}</Text>
            </View>
          </View>
          <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 19, fontWeight: "700", color: COLORS.text, marginBottom: 8 }}>{item.name}</Text>
          <Text style={{ fontSize: 19, fontWeight: "800", color: COLORS.text, marginBottom: 6 }}>{formatPrice(item.price)}</Text>
          <Text numberOfLines={1} style={{ fontSize: 11, color: COLORS.subText }}>{item.url}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SelectedMallCard({ item }: any) {
  return (
    <View style={{ borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E9EDF2", padding: 12, marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: COLORS.purpleSoft }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: COLORS.purple }}>{item.mallLabel}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: "800", color: COLORS.text }}>{formatPrice(item.price)}</Text>
      </View>
      <Text numberOfLines={2} style={{ fontSize: 13, lineHeight: 18, fontWeight: "700", color: COLORS.text }}>{item.name}</Text>
    </View>
  );
}

export default function AddProductScreen({ navigation }: Props) {
  const { addItem } = useTrackedItems(); // 🌟 전역 상태(Context) 연결
  
  const [mode, setMode] = useState<AddMode>("search"); // 🌟 원본: 기본탭은 search!
  
  // 검색 모드 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetSize, setTargetSize] = useState(""); 
  
  // 링크 모드 상태
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 🌟 백엔드 통신 스피너

  // --- 검색 모드 파생 상태 ---
  const searchResults = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return [];
    return MOCK_SEARCH_RESULTS.filter((item) => [item.name, item.mallLabel].join(" ").toLowerCase().includes(keyword));
  }, [searchQuery]);

  const selectedItems = useMemo(() => searchResults.filter((item) => selectedIds.includes(item.id)), [searchResults, selectedIds]);
  const cheapestSelected = useMemo(() => {
    if (selectedItems.length === 0) return null;
    return selectedItems.reduce((min, cur) => (cur.price < min.price ? cur : min));
  }, [selectedItems]);

  // --- 링크 모드 파생 상태 ---
  const normalized = useMemo(() => normalizeUrl(url), [url]);
  const mallLabel = useMemo(() => detectMallLabel(normalized), [normalized]);
  const validation = useMemo(() => {
    if (!url.trim()) return { type: "idle" as const, message: "검색이 안 될 때는 상품 링크를 직접 붙여넣을 수 있어요." };
    if (!normalized) return { type: "error" as const, message: "올바른 URL 형식이 아니에요. 링크를 다시 확인해주세요." };
    return { type: "success" as const, message: `${mallLabel ?? "쇼핑몰"} 링크를 확인했어요.` };
  }, [url, normalized, mallLabel]);

  const statusStyle = validation.type === "success" ? { backgroundColor: COLORS.greenSoft, borderColor: "#D9F0E1", textColor: COLORS.green } : validation.type === "error" ? { backgroundColor: COLORS.redSoft, borderColor: "#F6D8DF", textColor: COLORS.red } : { backgroundColor: COLORS.graySoft, borderColor: "#ECEFF3", textColor: COLORS.subText };

  function toggleSelected(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]);
  }

  // 🌟 원본: 검색으로 추가하기 핸들러 (Context에 연동)
  function handleSearchAdd() {
    if (selectedItems.length === 0) {
      Alert.alert("선택 필요", "추적할 상품을 하나 이상 선택해주세요.");
      return;
    }

    const now = new Date().toISOString();
    const lowest = cheapestSelected ?? selectedItems[0];

    const groupedItem: any = {
      id: `group-${Date.now()}`,
      name: selectedItems[0].name,
      brand: selectedItems[0].name.split(" ")[0] ?? null,
      targetSize: targetSize.trim() || undefined,
      currentPrice: lowest.price,
      previousPrice: lowest.price + 5000,
      currentStatus: "on_sale",
      previousStatus: "on_sale",
      isPinned: false,
      imageUrl: null,
      lastCheckedAt: now,
      createdAt: now,
      url: lowest.url,
      site: mapMallToSite(lowest.mall),
      sizes: { "230": "unknown", "235": "in_stock", "240": "in_stock", "245": "sold_out", "250": "unknown" },
      offers: selectedItems.map((item) => ({ mall: mapMallToSite(item.mall), mallLabel: item.mallLabel, price: item.price, url: item.url })),
    };

    addItem(groupedItem); // Context 업데이트
    navigation.goBack();  // 메인으로 복귀
  }

  // 🌟 신규: 백엔드 서버(API)로 링크를 긁어오는 핸들러
  async function handleDirectLinkAdd() {
    if (!normalized) {
      Alert.alert("URL 오류", "올바른 상품 링크를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 안드로이드 에뮬레이터 에러 시 localhost 대신 10.0.2.2 사용
      const API_URL = "http://localhost:3000/api/scrape"; 
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });

      const result = await response.json();

      if (result.success) {
        const now = new Date().toISOString();
        const scrapedData = result.data;
        
        const newItem: any = {
          id: `item-${Date.now()}`,
          name: scrapedData.name,
          brand: scrapedData.name.split(" ")[0] ?? "브랜드",
          targetSize: targetSize.trim() || undefined,
          currentPrice: scrapedData.currentPrice,
          previousPrice: scrapedData.currentPrice + 5000, 
          currentStatus: "on_sale",
          previousStatus: "on_sale",
          isPinned: false,
          imageUrl: scrapedData.imageUrl, // 백엔드가 긁어온 찐 이미지 URL!
          lastCheckedAt: now,
          createdAt: now,
          url: scrapedData.siteUrl,
          site: mapMallToSite(mallLabel || "official"),
          sizes: { "230": "unknown", "240": "in_stock" },
          offers: [{ mall: mapMallToSite(mallLabel || "official"), mallLabel: mallLabel || "공식몰", price: scrapedData.currentPrice, url: scrapedData.siteUrl }],
        };

        addItem(newItem);
        Alert.alert("추가 완료!", "상품이 성공적으로 추가되었습니다.");
        navigation.goBack();
      } else {
        Alert.alert("추출 실패", result.error || "데이터를 가져오지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("서버 연결 실패", "백엔드 서버(Node.js)가 켜져 있는지 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        
        {/* 공통 헤더 (원본 유지) */}
        <SectionCard>
          <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.text, letterSpacing: -0.3, marginBottom: 6 }}>상품 추가</Text>
          <Text style={{ fontSize: 13, color: COLORS.subText, lineHeight: 20, marginBottom: 14 }}>검색으로 상품 후보를 먼저 찾고, 원하는 쇼핑몰만 선택해서 하나의 상품으로 추적할 수 있어요.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <SupportChip label="공식몰" /><SupportChip label="무신사" /><SupportChip label="크림" /><SupportChip label="29CM" />
          </View>
        </SectionCard>

        {/* 탭 버튼 (원본 유지) */}
        <SectionCard>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TabButton label="검색으로 추가" selected={mode === "search"} onPress={() => setMode("search")} />
            <TabButton label="링크로 직접 추가" selected={mode === "link"} onPress={() => setMode("link")} />
          </View>
        </SectionCard>

        {mode === "search" ? (
          <>
            {/* --- 검색 모드 UI (원본 100% 유지) --- */}
            <SectionCard>
              <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 10 }}>상품 검색</Text>
              <Text style={{ fontSize: 13, color: COLORS.subText, lineHeight: 20, marginBottom: 12 }}>찾고 싶은 상품명을 입력하면 쇼핑몰별 후보를 보여줘요.</Text>
              <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="예: 나이키 V2K 런" placeholderTextColor={COLORS.muted} style={{ borderWidth: 1, borderColor: searchQuery.trim() ? "#111111" : COLORS.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: "#FFFFFF", fontSize: 14, color: COLORS.text, marginBottom: 12 }} />
            </SectionCard>

            <SectionCard>
              <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 10 }}>검색 결과</Text>
              {searchQuery.trim() === "" ? (
                <View style={{ borderRadius: 14, backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#F0F0F0", padding: 16 }}><Text style={{ fontSize: 13, color: COLORS.subText, lineHeight: 20 }}>검색어를 입력하면 공식몰, 무신사, 크림, 29CM 후보를 보여줄게요.</Text></View>
              ) : searchResults.length === 0 ? (
                <View style={{ borderRadius: 14, backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#F0F0F0", padding: 16 }}><Text style={{ fontSize: 13, color: COLORS.subText, lineHeight: 20 }}>검색 결과가 없어요. 검색어를 바꾸거나 링크 직접 추가를 사용해보세요.</Text></View>
              ) : (
                <>
                  {searchResults.map((item) => (
                    <SearchResultCard key={item.id} item={item} selected={selectedIds.includes(item.id)} onToggle={() => toggleSelected(item.id)} />
                  ))}
                </>
              )}
            </SectionCard>

            <SectionCard>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text }}>선택한 쇼핑몰 & 사이즈</Text>
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 6 }}>추적할 사이즈 (선택)</Text>
                <TextInput value={targetSize} onChangeText={setTargetSize} placeholder="예: 260" style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#FFFFFF", fontSize: 14 }} />
              </View>

              {selectedItems.length === 0 ? (
                <View style={{ borderRadius: 14, backgroundColor: "#FAFAFA", borderWidth: 1, borderColor: "#F0F0F0", padding: 16, marginBottom: 14 }}><Text style={{ fontSize: 13, color: COLORS.subText, lineHeight: 20 }}>아직 선택한 쇼핑몰이 없어요. 같은 상품으로 보이는 후보를 직접 골라주세요.</Text></View>
              ) : (
                <>
                  {cheapestSelected && (
                    <View style={{ borderRadius: 14, backgroundColor: COLORS.greenSoft, borderWidth: 1, borderColor: "#D9F0E1", padding: 12, marginBottom: 12 }}>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: COLORS.green, marginBottom: 4 }}>현재 선택 기준 최저가</Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: COLORS.text, marginBottom: 2 }}>{cheapestSelected.mallLabel}</Text>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: COLORS.text }}>{formatPrice(cheapestSelected.price)}</Text>
                    </View>
                  )}
                  <View style={{ borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 14 }}>
                    {selectedItems.map((item) => <SelectedMallCard key={item.id} item={item} />)}
                  </View>
                </>
              )}

              <Pressable onPress={handleSearchAdd} style={{ backgroundColor: selectedItems.length > 0 ? COLORS.black : "#D1D5DB", borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>이 상품 조합으로 추적 시작</Text>
              </Pressable>
            </SectionCard>
          </>
        ) : (
          <>
            {/* --- 링크 모드 UI (서버 API 연동 적용) --- */}
            <SectionCard>
              <Text style={{ fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 10 }}>링크로 직접 추가</Text>
              <Text style={{ fontSize: 13, color: COLORS.subText, lineHeight: 20, marginBottom: 12 }}>검색 결과가 없거나 원하는 상품을 직접 등록하고 싶다면 링크를 붙여넣어 추가할 수 있어요. 서버가 데이터를 대신 읽어옵니다.</Text>
              
              <TextInput value={url} onChangeText={setUrl} placeholder="예: https://www.musinsa.com/..." autoCapitalize="none" autoCorrect={false} multiline style={{ minHeight: 96, borderWidth: 1, borderColor: normalized ? "#111111" : COLORS.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, backgroundColor: "#FFFFFF", fontSize: 14, color: COLORS.text, textAlignVertical: "top", marginBottom: 12 }} />

              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, color: COLORS.subText, marginBottom: 6 }}>추적할 사이즈 (선택)</Text>
                <TextInput value={targetSize} onChangeText={setTargetSize} placeholder="예: 260" style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: "#FFFFFF", fontSize: 14 }} />
              </View>

              <View style={{ borderWidth: 1, borderColor: statusStyle.borderColor, backgroundColor: statusStyle.backgroundColor, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: statusStyle.textColor }}>{validation.message}</Text>
              </View>

              {normalized && (
                <View style={{ borderRadius: 14, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 14 }}>
                  <Text style={{ fontSize: 11, color: COLORS.subText, marginBottom: 6, fontWeight: "700" }}>확인된 링크</Text>
                  {mallLabel && (
                    <View style={{ alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: COLORS.blueSoft, marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: "800", color: COLORS.blue }}>{mallLabel}</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 12, color: COLORS.text, lineHeight: 18 }}>{normalized}</Text>
                </View>
              )}

              {/* 🌟 기존의 껍데기 버튼 대신, API 통신이 가능한 진짜 버튼! */}
              <Pressable 
                onPress={handleDirectLinkAdd} 
                disabled={isLoading || !normalized}
                style={{ backgroundColor: normalized ? COLORS.black : "#D1D5DB", borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row" }}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>서버에서 정보 수집 중...</Text>
                  </>
                ) : (
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>서버를 통해 추적 시작하기</Text>
                )}
              </Pressable>
            </SectionCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
