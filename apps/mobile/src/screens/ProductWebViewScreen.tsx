import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

// 🌟 공통 테마 및 타입 임포트 (경로를 통합된 폴더로 맞춤)
import { COLORS } from "../constants/theme";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ProductWebView">;

type ExtractResult = {
  type: "EXTRACT_RESULT";
  name: string | null;
  sale_price: number | null;
  product_status: "on_sale" | "sold_out" | "ended" | "unknown";
  sizes: Record<string, "in_stock" | "sold_out" | "unknown">;
  confidence: number;
  price_texts_sample: string[];
};

function formatPrice(value: number | null) {
  if (value == null) return "가격 정보 없음";
  return `${value.toLocaleString("ko-KR")}원`;
}

function getStatusMeta(status: ExtractResult["product_status"]) {
  switch (status) {
    case "on_sale":
      return { label: "판매중", bg: COLORS.greenSoft, color: COLORS.green };
    case "sold_out":
      return { label: "품절", bg: COLORS.redSoft, color: COLORS.red };
    case "ended":
      return { label: "판매 종료", bg: COLORS.graySoft, color: COLORS.subText };
    case "unknown":
    default:
      return { label: "상태 미확인", bg: COLORS.yellowSoft, color: COLORS.yellow };
  }
}

function getConfidenceMeta(confidence: number) {
  if (confidence >= 0.8) {
    return { label: "신뢰도 높음", bg: COLORS.greenSoft, color: COLORS.green };
  }
  if (confidence >= 0.5) {
    return { label: "신뢰도 보통", bg: COLORS.blueSoft, color: COLORS.blue };
  }
  return { label: "신뢰도 낮음", bg: COLORS.redSoft, color: COLORS.red };
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 18,
          padding: 14,
          marginBottom: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FAFAFA",
        borderWidth: 1,
        borderColor: "#F0F0F0",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <Text style={{ fontSize: 11, color: COLORS.subText, marginBottom: 4 }}>
        {label}
      </Text>
      <Text
        numberOfLines={2}
        style={{ fontSize: 14, fontWeight: "800", color: COLORS.text }}
      >
        {value}
      </Text>
    </View>
  );
}

function SizePill({ label, status }: { label: string; status: "in_stock" | "sold_out" | "unknown" }) {
  const style =
    status === "in_stock"
      ? { bg: COLORS.greenSoft, color: COLORS.green }
      : status === "sold_out"
      ? { bg: COLORS.redSoft, color: COLORS.red }
      : { bg: COLORS.graySoft, color: COLORS.subText };

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: style.bg,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: style.color }}>
        {label}
      </Text>
    </View>
  );
}

export default function ProductWebViewScreen({ route, navigation }: Props) {
  const { url } = route.params;
  const [extract, setExtract] = useState<ExtractResult | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [webKey, setWebKey] = useState(0);

  const injected = useMemo(() => {
    return `
      (function() {
        function cleanText(txt) {
          if (!txt) return "";
          return String(txt).replace(/\\s+/g, " ").trim();
        }

        function toIntPrice(txt) {
          if (!txt) return null;
          const m = (txt + '').match(/[0-9][0-9,]*/g);
          if (!m) return null;
          const n = parseInt(m[0].replace(/,/g,''), 10);
          if (!Number.isFinite(n) || n <= 0 || n > 1000000000) return null;
          return n;
        }

        function getMetaContent(selector) {
          const el = document.querySelector(selector);
          if (!el) return null;
          const content = el.getAttribute("content");
          return cleanText(content);
        }

        function guessProductName() {
          const metaOg = getMetaContent('meta[property="og:title"]');
          if (metaOg && metaOg.length >= 3) return metaOg;

          const metaTwitter = getMetaContent('meta[name="twitter:title"]');
          if (metaTwitter && metaTwitter.length >= 3) return metaTwitter;

          const h1 = document.querySelector("h1");
          const h1Text = cleanText(h1 ? h1.textContent : "");
          if (h1Text && h1Text.length >= 3) return h1Text;

          const titleText = cleanText(document.title || "");
          if (titleText && titleText.length >= 3) return titleText;

          const elements = Array.from(
            document.querySelectorAll("h1, h2, strong, div, span")
          ).slice(0, 500);

          const candidates = elements
            .map(el => cleanText(el.textContent || ""))
            .filter(t => t.length >= 5 && t.length <= 80);

          if (candidates.length) return candidates[0];

          return null;
        }

        function findPriceTexts() {
          const texts = [];
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            const t = cleanText(node.nodeValue || "");
            if (t.includes("원") && /[0-9]/.test(t)) texts.push(t);
            if (texts.length > 80) break;
          }
          return texts;
        }

        function guessSalePrice(priceTexts) {
          const nums = priceTexts.map(toIntPrice).filter(Boolean);
          if (!nums.length) return null;
          return Math.min.apply(null, nums);
        }

        function extractSizes() {
          const result = {};
          const elements = Array.from(
            document.querySelectorAll("button, li, option, div, span")
          ).slice(0, 1200);

          const candidates = elements.filter(el => {
            const t = cleanText(el.textContent || "");
            if (!t) return false;
            if (t.length > 12) return false;
            return /^(XS|S|M|L|XL|XXL|FREE|OS|ONE|\\d{2,3})$/i.test(t);
          }).slice(0, 200);

          candidates.forEach(el => {
            const label = cleanText(el.textContent || "");
            if (!label) return;

            let score = 0;
            const cls = (el.getAttribute("class") || "").toLowerCase();
            const aria = (el.getAttribute("aria-disabled") || "").toLowerCase();
            const disabled = el.disabled === true;

            if (disabled) score += 3;
            if (aria === "true") score += 3;
            if (/sold|outofstock|disabled|품절/.test(cls)) score += 2;
            if ((el.textContent || "").includes("품절")) score += 3;

            let status = "in_stock";
            if (score >= 3) status = "sold_out";

            if (result[label] === "sold_out") return;
            result[label] = status;
          });

          return result;
        }

        function guessProductStatus(price, sizes) {
          const bodyText = cleanText(
            document.body ? document.body.innerText : ""
          ).toLowerCase();

          if (/판매종료|종료됨|구매불가/.test(bodyText)) return "ended";
          if (/품절/.test(bodyText)) {
            const keys = Object.keys(sizes || {});
            if (keys.length > 0) {
              const allSoldOut = keys.every(k => sizes[k] === "sold_out");
              if (allSoldOut) return "sold_out";
            }
          }
          if (price) return "on_sale";
          return "unknown";
        }

        function extract() {
          const name = guessProductName();
          const priceTexts = findPriceTexts();
          const sale = guessSalePrice(priceTexts);
          const sizes = extractSizes();
          const productStatus = guessProductStatus(sale, sizes);

          const sizeKeys = Object.keys(sizes || {});
          let confidence = 0;

          if (name) confidence += 0.3;
          if (sale) confidence += 0.3;
          if (productStatus !== "unknown") confidence += 0.2;
          if (sizeKeys.length > 0) confidence += 0.2;

          confidence = Math.max(0, Math.min(1, confidence));

          const payload = {
            type: "EXTRACT_RESULT",
            name: name,
            sale_price: sale,
            product_status: productStatus,
            sizes: sizes,
            confidence: confidence,
            price_texts_sample: priceTexts.slice(0, 10),
          };

          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }

        // 🌟 기능 개선: 최대 10초까지 대기하며 안정적으로 파싱하도록 수정
        let tries = 0;
        const maxTries = 10;
        
        function attemptExtract() {
          tries += 1;
          const name = guessProductName();
          const priceTexts = findPriceTexts();
          
          // 이름과 가격이 발견되었거나 10초가 지나면 무조건 추출 시도
          if ((name && priceTexts.length > 0) || tries >= maxTries) {
            extract();
          } else {
            setTimeout(attemptExtract, 1000);
          }
        }
        
        attemptExtract();
      })();
      true;
    `;
  }, []);

  const summary = useMemo(() => {
    if (!extract) {
      return {
        title: "추출 대기중",
        description: "상품 정보를 확인하는 중이에요.",
      };
    }

    if (!extract.name && !extract.sale_price) {
      return {
        title: "확인 정보 부족",
        description: "페이지는 열렸지만 상품명이나 가격을 충분히 찾지 못했어요.",
      };
    }

    return {
      title: "추출 완료",
      description: "상품명, 가격, 상태 정보를 확인했어요.",
    };
  }, [extract]);

  const sizeEntries = useMemo(
    () => Object.entries(extract?.sizes ?? {}),
    [extract]
  );

  const statusMeta = extract ? getStatusMeta(extract.product_status) : null;
  const confidenceMeta = extract ? getConfidenceMeta(extract.confidence) : null;

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <SectionCard style={{ width: "100%", maxWidth: 560 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: COLORS.text,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              웹에서는 추출 테스트를 지원하지 않아요
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: COLORS.subText,
                textAlign: "center",
                lineHeight: 22,
                marginBottom: 16,
              }}
            >
              이 화면은 react-native-webview 기반이라서
              {"\n"}
              모바일 기기 또는 에뮬레이터에서 확인해야 해요.
            </Text>

            <View
              style={{
                backgroundColor: "#F8FAFC",
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: COLORS.subText,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                등록한 URL
              </Text>
              <Text selectable style={{ fontSize: 13, color: COLORS.text }}>
                {url}
              </Text>
            </View>

            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: COLORS.black,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                이전 화면으로
              </Text>
            </Pressable>
          </SectionCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 10,
          backgroundColor: COLORS.bg,
        }}
      >
        <SectionCard style={{ marginBottom: 0 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: COLORS.text,
              marginBottom: 6,
            }}
          >
            상품 정보 확인
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: COLORS.subText,
              lineHeight: 20,
              marginBottom: 12,
            }}
          >
            상품 페이지를 불러와 추적에 필요한 정보를 확인하고 있어요.
          </Text>

          <View
            style={{
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 14,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: COLORS.subText,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              현재 링크
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 12, color: COLORS.text }}>
              {url}
            </Text>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: extract ? "#D9F0E1" : "#ECEFF3",
              backgroundColor: extract ? COLORS.greenSoft : COLORS.graySoft,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: extract ? COLORS.green : COLORS.subText,
                marginBottom: 3,
              }}
            >
              {summary.title}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: extract ? COLORS.green : COLORS.subText,
              }}
            >
              {summary.description}
            </Text>
          </View>
        </SectionCard>
      </View>

      <View style={{ flex: 1 }}>
        <WebView
          key={webKey}
          source={{ uri: url }}
          injectedJavaScript={injected}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data) as ExtractResult;
              if (msg.type === "EXTRACT_RESULT") {
                setExtract(msg);
              }
            } catch {}
          }}
        />
      </View>

      <ScrollView
        style={{
          maxHeight: 320,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.bg,
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
      >
        <SectionCard>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: COLORS.text,
              marginBottom: 12,
            }}
          >
            추출 결과 요약
          </Text>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <MetricChip
              label="상품명"
              value={extract?.name ?? "확인 전"}
            />
            <MetricChip
              label="판매가"
              value={formatPrice(extract?.sale_price ?? null)}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <MetricChip
              label="상태"
              value={statusMeta?.label ?? "확인 전"}
            />
            <MetricChip
              label="신뢰도"
              value={confidenceMeta?.label ?? "확인 전"}
            />
          </View>

          {extract ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: statusMeta?.bg ?? COLORS.graySoft,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: statusMeta?.color ?? COLORS.subText,
                  }}
                >
                  {statusMeta?.label}
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: confidenceMeta?.bg ?? COLORS.graySoft,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: confidenceMeta?.color ?? COLORS.subText,
                  }}
                >
                  신뢰도 {extract.confidence.toFixed(2)}
                </Text>
              </View>
            </View>
          ) : null}

          {sizeEntries.length > 0 ? (
            <>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: COLORS.text,
                  marginBottom: 8,
                }}
              >
                감지된 사이즈
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
                {sizeEntries.map(([label, status]) => (
                  <SizePill key={label} label={`${label} · ${status === "in_stock" ? "재고 있음" : status === "sold_out" ? "품절" : "미확인"}`} status={status} />
                ))}
              </View>
            </>
          ) : (
            <View
              style={{
                borderRadius: 12,
                backgroundColor: "#FAFAFA",
                borderWidth: 1,
                borderColor: "#F0F0F0",
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 12, color: COLORS.subText, lineHeight: 18 }}>
                아직 감지된 사이즈 정보가 없어요.
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            <Pressable
              onPress={() => setWebKey((prev) => prev + 1)}
              style={{
                flex: 1,
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.text }}>
                다시 불러오기
              </Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                try {
                  await Linking.openURL(url);
                } catch {
                  Alert.alert("오류", "링크를 열 수 없어요.");
                }
              }}
              style={{
                flex: 1,
                backgroundColor: COLORS.black,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>
                원본 링크 열기
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              if (!extract) {
                Alert.alert("아직 추출 전", "상품 정보를 조금 더 기다려주세요.");
                return;
              }

              Alert.alert(
                "추출 결과 확인",
                `상품명: ${extract.name ?? "없음"}\n판매가: ${formatPrice(
                  extract.sale_price
                )}\n상태: ${statusMeta?.label ?? "미확인"}`
              );
            }}
            style={{
              backgroundColor: extract ? COLORS.blue : "#D1D5DB",
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>
              추출 결과 확인
            </Text>
          </Pressable>
        </SectionCard>

        <SectionCard>
          <Pressable
            onPress={() => setShowRawJson((prev) => !prev)}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: showRawJson ? 10 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: COLORS.text,
              }}
            >
              원시 추출 데이터
            </Text>

            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: COLORS.subText,
              }}
            >
              {showRawJson ? "접기" : "펼치기"}
            </Text>
          </Pressable>

          {showRawJson ? (
            <View
              style={{
                borderRadius: 12,
                backgroundColor: "#FAFAFA",
                borderWidth: 1,
                borderColor: "#F0F0F0",
                padding: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: COLORS.text,
                  lineHeight: 18,
                }}
              >
                {extract ? JSON.stringify(extract, null, 2) : "추출 대기중..."}
              </Text>
            </View>
          ) : null}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
