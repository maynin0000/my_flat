import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { Alert, Button, SafeAreaView, Text, TextInput, View } from "react-native";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "AddProduct">;

function normalizeUrl(input: string): string | null {
  const u = input.trim();
  if (!u) return null;

  // 스킴 없으면 https 붙임
  const withScheme = /^https?:\/\//i.test(u) ? u : `https://${u}`;

  try {
    const parsed = new URL(withScheme);
    return parsed.toString();
  } catch {
    return null;
  }
}

export default function AddProductScreen({ navigation }: Props) {
  const [url, setUrl] = useState("");

  const normalized = useMemo(() => normalizeUrl(url), [url]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>상품 링크 등록</Text>
        <Text style={{ color: "#666" }}>
          무신사 상품 상세 URL을 붙여넣고 “열기”를 누르세요.
        </Text>

        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://www.musinsa.com/app/goods/..."
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />

        <Button
          title="열기 (WebView)"
          onPress={() => {
            if (!normalized) {
              Alert.alert("URL 오류", "올바른 URL을 입력해줘.");
              return;
            }
            navigation.navigate("ProductWebView", { url: normalized });
          }}
        />

        {normalized ? (
          <Text style={{ fontSize: 12, color: "#999" }}>정규화 URL: {normalized}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}