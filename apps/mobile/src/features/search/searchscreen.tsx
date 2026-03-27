// apps/mobile/src/features/search/searchscreen.tsx 내부 수정
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';

export const Searchscreen = () => {
  // 네비게이션 훅 사용
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // ... 중략 (기존 코드)

  return (
    <SafeAreaView style={styles.container}>
      {/* ... */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Mastercard 
            product={item} 
            onPress={() => navigation.navigate('ProductDetail', { product: item })} 
          />
        )}
      />
    </SafeAreaView>
  );
};