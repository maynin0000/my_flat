import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import type { RootStackParamList } from "../../App";

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

export default function ProductWebViewScreen({ route }: Props) {
  const { url } = route.params;
  const [extract, setExtract] = useState<ExtractResult | null>(null);

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

        extract();

        let tries = 0;
        const timer = setInterval(() => {
          tries += 1;
          extract();
          if (tries >= 4) clearInterval(timer);
        }, 1000);
      })();
      true;
    `;
  }, []);

  const summary = useMemo(() => {
    if (!extract) return "추출 대기중...";
    const sizeCount = Object.keys(extract.sizes || {}).length;
    return [
      extract.name ? `name=${extract.name}` : "name=null",
      `sale_price=${extract.sale_price ?? "null"}`,
      `status=${extract.product_status}`,
      `sizes=${sizeCount}`,
      `conf=${extract.confidence.toFixed(2)}`,
    ].join(" / ");
  }, [extract]);

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "600" }}>
            웹에서는 상품 추출 테스트를 지원하지 않음
          </Text>

          <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
            현재 이 화면은 react-native-webview 기반이라서
            {"\n"}
            Expo Go 또는 모바일 에뮬레이터에서 확인해야 해.
          </Text>

          <View
            style={{
              width: "100%",
              padding: 16,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              backgroundColor: "#fafafa",
              marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: "#999", marginBottom: 8 }}>
              등록한 URL
            </Text>
            <Text selectable style={{ fontSize: 14 }}>
              {url}
            </Text>
          </View>

          <Text style={{ fontSize: 13, color: "#999", textAlign: "center" }}>
            웹에서는 UI 흐름만 확인하고,
            {"\n"}
            실제 추출 기능은 나중에 모바일에서 테스트하면 돼.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, gap: 8 }}>
        <Text numberOfLines={1} style={{ fontSize: 12, color: "#666" }}>
          {url}
        </Text>

        <Text style={{ fontSize: 12 }}>{summary}</Text>

        <Button
          title="추출 결과 보기"
          onPress={() => {
            if (!extract) {
              Alert.alert("아직", "추출 결과가 아직 없어.");
              return;
            }
            Alert.alert("Extract", JSON.stringify(extract, null, 2).slice(0, 2000));
          }}
        />
      </View>

      <WebView
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

      <ScrollView style={{ maxHeight: 160, borderTopWidth: 1, borderColor: "#eee" }}>
        <Text style={{ padding: 12, fontSize: 12, color: "#333" }}>
          {extract ? JSON.stringify(extract, null, 2) : "추출 대기중..."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}