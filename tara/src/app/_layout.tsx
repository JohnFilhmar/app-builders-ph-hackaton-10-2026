import '@/global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LevelUpOverlay } from '@/components/tara/LevelUpOverlay';
import { useGameStore } from '@/lib/stores/gameStore';

export default function RootLayout() {
  const refresh = useGameStore((s) => s.refresh);
  // a new day or a clock change must re-derive caps and streaks without a restart
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFBF2' } }} />
      <LevelUpOverlay />
    </SafeAreaProvider>
  );
}
