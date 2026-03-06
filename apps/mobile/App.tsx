import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AddProductScreen from "./src/screens/AddProductScreen";
import ProductWebViewScreen from "./src/screens/ProductWebViewScreen";

export type RootStackParamList = {
  AddProduct: undefined;
  ProductWebView: { url: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}