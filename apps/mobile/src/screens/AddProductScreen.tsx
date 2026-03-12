import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "AddProduct">;

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
  red: "#E11D48",
  redSoft: "#FFF1F2",
  green: "#16A34A",
  greenSoft: "#ECFDF3",
  graySoft: "#F3F4F6",
};

function normalizeUrl(input: string): string | null {
  const u = input.trim();
  if (!u) return null;

  const withScheme = /^https?:\/\//i.test(u) ? u : `https://${u}`;

  try {
    const parsed = new URL(withScheme);
    return parsed.toString();
  } catch {
    return null;
  }
}

function detectMallLabel(url: string | null) {
  if (!url) return null;

  const lower = url.toLowerCase();

  if (lower.includes("musinsa")) return "무신사";
  if (lower.includes("kream")) return "크림";
  if (lower.includes("29cm")) return "29CM";
  if (lower.includes("shop")) return "공식몰";
  return "외부 쇼핑몰";
}

function SupportChip({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.text }}>
        {label}
      </Text>
    </View>
  );
}

function SectionCard({
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
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 20,
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

export default function AddProductScreen({ navigation }: Props) {
  const [url, setUrl] = useState("");

  const normalized = useMemo(() => normalizeUrl(url), [url]);

  const mallLabel = useMemo(() => detectMallLabel(normalized), [normalized]);

  const validation = useMemo(() => {
    if (!url.trim()) {
      return {
        type: "idle" as const,
        message: "상품 링크를 붙여넣으면 추적을 시작할 수 있어요.",
      };
    }

    if (!normalized) {
      return {
        type: "error" as const,
        message: "올바른 URL 형식이 아니에요. 링크를 다시 확인해주세요.",
      };
    }

    return {
      type: "success" as const,
      message: `${mallLabel ?? "쇼핑몰"} 링크를 확인했어요.`,
    };
  }, [url, normalized, mallLabel]);

  const statusStyle =
    validation.type === "success"
      ? {
          backgroundColor: COLORS.greenSoft,
          borderColor: "#D9F0E1",
          textColor: COLORS.green,
        }
      : validation.type === "error"
      ? {
          backgroundColor: COLORS.redSoft,
          borderColor: "#F6D8DF",
          textColor: COLORS.red,
        }
      : {
          backgroundColor: COLORS.graySoft,
          borderColor: "#ECEFF3",
          textColor: COLORS.subText,
        };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 28,
        }}
      >
        <SectionCard>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "800",
              color: COLORS.text,
              letterSpacing: -0.3,
              marginBottom: 6,
            }}
          >
            상품 추가
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: COLORS.subText,
              lineHeight: 20,
              marginBottom: 14,
            }}
          >
            상품 링크를 붙여넣으면 상세 페이지를 열어 추적할 상품을 등록할 수 있어요.
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <SupportChip label="공식몰" />
            <SupportChip label="무신사" />
            <SupportChip label="크림" />
            <SupportChip label="29CM" />
          </View>
        </SectionCard>

        <SectionCard>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: COLORS.text,
              marginBottom: 10,
            }}
          >
            상품 링크 입력
          </Text>

          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="예: https://www.musinsa.com/app/goods/..."
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            style={{
              minHeight: 96,
              borderWidth: 1,
              borderColor: normalized ? "#111111" : COLORS.border,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 14,
              backgroundColor: "#FFFFFF",
              fontSize: 14,
              color: COLORS.text,
              textAlignVertical: "top",
              lineHeight: 20,
              marginBottom: 12,
            }}
          />

          <View
            style={{
              borderWidth: 1,
              borderColor: statusStyle.borderColor,
              backgroundColor: statusStyle.backgroundColor,
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: statusStyle.textColor,
              }}
            >
              {validation.message}
            </Text>
          </View>

          {normalized ? (
            <View
              style={{
                borderRadius: 14,
                backgroundColor: "#F8FAFC",
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: COLORS.subText,
                  marginBottom: 6,
                  fontWeight: "700",
                }}
              >
                확인된 링크
              </Text>

              {mallLabel ? (
                <View
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: COLORS.blueSoft,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: COLORS.blue,
                    }}
                  >
                    {mallLabel}
                  </Text>
                </View>
              ) : null}

              <Text
                style={{
                  fontSize: 12,
                  color: COLORS.text,
                  lineHeight: 18,
                }}
              >
                {normalized}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => {
              if (!normalized) {
                Alert.alert("URL 오류", "올바른 상품 링크를 입력해주세요.");
                return;
              }

              navigation.navigate("ProductWebView", { url: normalized });
            }}
            style={{
              backgroundColor: normalized ? COLORS.black : "#D1D5DB",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              상품 페이지 열기
            </Text>
          </Pressable>
        </SectionCard>

        <SectionCard>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: COLORS.text,
              marginBottom: 10,
            }}
          >
            등록 안내
          </Text>

          <View
            style={{
              backgroundColor: "#FAFAFA",
              borderWidth: 1,
              borderColor: "#F0F0F0",
              borderRadius: 14,
              padding: 14,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 13, color: COLORS.text, lineHeight: 20 }}>
              1. 상품 상세 페이지 링크를 붙여넣어요.
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.text, lineHeight: 20 }}>
              2. 상품 페이지를 열어 가격과 상품 정보를 확인해요.
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.text, lineHeight: 20 }}>
              3. 확인한 상품을 추적 목록에 추가해요.
            </Text>
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}