import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, ScrollView, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "ProductWebView">;

type ExtractResult = {
  type: "EXTRACT_RESULT";
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
        function toIntPrice(txt) {
          if (!txt) return null;
          const m = (txt + '').match(/[0-9][0-9,]*/g);
          if (!m) return null;
          const n = parseInt(m[0].replace(/,/g,''), 10);
          if (!Number.isFinite(n) || n <= 0 || n > 1000000000) return null;
          return n;
        }

        function findPriceTexts() {
          const texts = [];
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            const t = (node.nodeValue || '').trim();
            if (t.includes('원') && /[0-9]/.test(t)) texts.push(t);
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
          const elements = Array.from(document.querySelectorAll("button, li, option, div, span")).slice(0, 1200);

          const candidates = elements.filter(el => {
            const t = (el.textContent || '').trim();
            if (!t) return false;
            if (t.length > 12) return false;
            return /^(XS|S|M|L|XL|XXL|FREE|OS|ONE|\\d{2,3})$/.test(t) || /FREE/i.test(t);
          }).slice(0, 200);

          candidates.forEach(el => {
            const label = (el.textContent || '').trim();
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

        function extract() {
          const priceTexts = findPriceTexts();
          const sale = guessSalePrice(priceTexts);
          const sizes = extractSizes();

          let productStatus = "unknown";
          if (sale) productStatus = "on_sale";

          const sizeKeys = Object.keys(sizes);
          const unknownCount = sizeKeys.filter(k => sizes[k] === "unknown").length;
          const sizeScore = sizeKeys.length ? (1 - (unknownCount / sizeKeys.length)) : 0;

          let confidence = 0;
          if (sale) confidence += 0.4;
          confidence += Math.min(0.4, sizeScore * 0.4);
          if (productStatus !== "unknown") confidence += 0.1;
          if (priceTexts.length) confidence += 0.1;
          confidence = Math.max(0, Math.min(1, confidence));

          const payload = {
            type: "EXTRACT_RESULT",
            sale_price: sale,
            product_status: productStatus,
            sizes: sizes,
            confidence: confidence,
            price_texts_sample: priceTexts.slice(0, 10),
          };
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }

        // 즉시 1회 + 1초 간격 4회 재시도
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
    return `sale_price=${extract.sale_price ?? "null"} / sizes=${sizeCount} / conf=${extract.confidence.toFixed(2)}`;
  }, [extract]);

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
            if (msg.type === "EXTRACT_RESULT") setExtract(msg);
          } catch {}
        }}
      />

      {/* 작은 디버그 패널 */}
      <ScrollView style={{ maxHeight: 160, borderTopWidth: 1, borderColor: "#eee" }}>
        <Text style={{ padding: 12, fontSize: 12, color: "#333" }}>
          {extract ? JSON.stringify(extract, null, 2) : "추출 대기중..."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}