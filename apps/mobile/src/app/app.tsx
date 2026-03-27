// apps/mobile/App.tsx (혹은 src/app/index.tsx)
import React from 'react';
import { AppNavigator } from './src/app/navigation';
import { ClosetProvider } from './src/features/wishlist/closetcontext';

export default function App() {
  return (
    <ClosetProvider>
      <AppNavigator />
    </ClosetProvider>
  );
}