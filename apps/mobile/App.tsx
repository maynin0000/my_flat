import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AddProductScreen from "./src/screens/AddProductScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import ProductWebViewScreen from "./src/screens/ProductWebViewScreen";
import TrackedProductsScreen from "./src/screens/TrackedProductsScreen";
import type { TrackedListing } from "./src/types/trackedListing";

export type RootStackParamList = {
  TrackedProducts: undefined;
  AddProduct: undefined;
  ProductWebView: { url: string };
  ProductDetail: { item: TrackedListing };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="TrackedProducts">
        <Stack.Screen
          name="TrackedProducts"
          component={TrackedProductsScreen}
          options={{ title: "추적 상품" }}
        />
        <Stack.Screen
          name="AddProduct"
          component={AddProductScreen}
          options={{ title: "상품 추가" }}
        />
        <Stack.Screen
          name="ProductWebView"
          component={ProductWebViewScreen}
          options={{ title: "상품 확인" }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: "상품 상세" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}