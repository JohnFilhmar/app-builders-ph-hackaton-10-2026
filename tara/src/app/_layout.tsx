import '@/global.css';

import { PixelifySans_500Medium, PixelifySans_700Bold, useFonts } from '@expo-google-fonts/pixelify-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LevelUpOverlay } from '@/components/tara/LevelUpOverlay';
import { useGameStore } from '@/lib/stores/gameStore';

export default function RootLayout() {
  const refresh = useGameStore((s) => s.refresh);
  // bundled with the app, so this resolves offline in a few frames
  const [hasFonts] = useFonts({ PixelifySans_500Medium, PixelifySans_700Bold });
  // a new day or a clock change must re-derive caps and streaks without a restart
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  if (!hasFonts) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFBF2' } }} />
      <LevelUpOverlay />
    </SafeAreaProvider>
  );
}
