// apps/mobile/src/app/navigation.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { Productdetail } from '../features/product/productdetail';
import { Searchscreen } from '../features/search/searchscreen';
import { Wishlistscreen } from '../features/wishlist/wishlistscreen'; // 파일 생성 예정
import { theme } from '../shared/theme/theme';
import { RootStackParamList, TabParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// 1. 하단 탭 구성
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen 
        name="SearchTab" 
        component={Searchscreen} 
        options={{ title: '통합 검색' }} 
      />
      <Tab.Screen 
        name="ClosetTab" 
        component={Wishlistscreen} 
        options={{ title: '내 옷장' }} 
      />
    </Tab.Navigator>
  );
};

// 2. 전체 스택 구성 (탭 + 상세페이지)
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerBackTitle: '뒤로' }}>
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ProductDetail" 
          component={Productdetail} 
          options={{ title: '상품 정보' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};