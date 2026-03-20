import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import AddProductScreen from "./src/screens/AddProductScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import ProductWebViewScreen from "./src/screens/ProductWebViewScreen";
import TrackedProductsScreen from "./src/screens/TrackedProductsScreen";

import { TrackedItemsProvider } from "./src/context/TrackedItemsContext";
import type { RootStackParamList } from "./src/types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <TrackedItemsProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="TrackedProducts" screenOptions={{ headerTitleAlign: "center" }}>
          <Stack.Screen name="TrackedProducts" component={TrackedProductsScreen} options={{ title: "추적 상품" }} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: "상품 추가" }} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "상품 상세" }} />
          <Stack.Screen name="ProductWebView" component={ProductWebViewScreen} options={{ title: "상품 정보 확인" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </TrackedItemsProvider>
  );
}
