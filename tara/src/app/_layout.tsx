import '@/global.css';

import { PixelifySans_500Medium, PixelifySans_700Bold, useFonts } from '@expo-google-fonts/pixelify-sans';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LevelUpOverlay } from '@/components/tara/LevelUpOverlay';
import { expireOverdue } from '@/lib/quests/abortQuest';
import { useGameStore } from '@/lib/stores/gameStore';

export default function RootLayout() {
  const refresh = useGameStore((s) => s.refresh);
  // bundled with the app, so this resolves offline in a few frames
  const [hasFonts] = useFonts({ PixelifySans_500Medium, PixelifySans_700Bold, SpaceMono_700Bold });
  // a new day or a clock change must re-derive caps and streaks without a restart
  // quests left undone past the overdue window expire on resume and once a minute while open
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      refresh();
      expireOverdue();
    });
    const timer = setInterval(expireOverdue, 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, [refresh]);

  // tapping a quest reminder opens that quest
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const questId: unknown = response.notification.request.content.data?.quest_id;
      if (typeof questId === 'string') router.push(`/quest/${questId}`);
    });
    return () => sub.remove();
  }, []);

  if (!hasFonts) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFBF2' } }} />
      <LevelUpOverlay />
    </SafeAreaProvider>
  );
}
