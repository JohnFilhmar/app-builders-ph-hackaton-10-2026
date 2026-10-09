import { router, Tabs, usePathname } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder, useWindowDimensions, View } from 'react-native';

import { PixelIcon, type PixelIconName } from '@/components/poly/PixelIcon';
import { useT } from '@/lib/i18n/translate';
import { PALETTE } from '@/lib/theme/palette';

const TABS = ['/bahay', '/gawain', '/pabuya'] as const;
const STREAKS = [0.18, 0.34, 0.52, 0.7, 0.86];

const tabIcon = (name: PixelIconName) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <PixelIcon name={name} size={22} color={focused ? PALETTE.ink900 : PALETTE.tara300} />;
  };

/**
 * The three tabs. A horizontal swipe anywhere moves to the next or previous tab and wraps around (Rewards to Home),
 * with a sweep of gold speed streaks across the screen in the swipe's direction.
 */
export default function MainTabs() {
  const t = useT();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const sweep = useRef(new Animated.Value(0)).current;
  const direction = useRef(1);
  const current = useRef(pathname);
  current.current = pathname;

  const swipe = useMemo(
    () =>
      PanResponder.create({
        // only clear horizontal flicks: vertical scrolling and taps stay with the screen underneath
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) < 70) return;
          const step = g.dx < 0 ? 1 : -1;
          const index = Math.max(0, TABS.findIndex((tab) => current.current.startsWith(tab)));
          const next = TABS[(index + step + TABS.length) % TABS.length] ?? '/bahay';
          direction.current = step;
          sweep.setValue(0);
          Animated.timing(sweep, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
          router.navigate(next);
        },
      }),
    [sweep],
  );

  return (
    <View className="flex-1" {...swipe.panHandlers}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          tabBarActiveTintColor: PALETTE.ink900,
          tabBarInactiveTintColor: PALETTE.tara300,
          tabBarStyle: { backgroundColor: PALETTE.banig50, borderTopColor: PALETTE.banig300, borderTopWidth: 2.5, paddingTop: 4 },
          tabBarLabelStyle: { fontFamily: 'PixelifySans_500Medium', fontSize: 13 },
        }}
      >
        <Tabs.Screen name="bahay" options={{ title: t('Home', 'Bahay'), tabBarIcon: tabIcon('home') }} />
        <Tabs.Screen name="gawain" options={{ title: t('Quests', 'Gawain'), tabBarIcon: tabIcon('scroll') }} />
        <Tabs.Screen name="pabuya" options={{ title: t('Rewards', 'Pabuya'), tabBarIcon: tabIcon('chest') }} />
      </Tabs>
      <View className="absolute inset-0" pointerEvents="none">
        {STREAKS.map((top, i) => (
          <Animated.View
            key={top}
            style={{
              position: 'absolute',
              top: `${top * 100}%`,
              left: 0,
              width: width * (0.35 + (i % 2) * 0.2),
              height: i % 2 ? 3 : 5,
              backgroundColor: i % 2 ? PALETTE.sipag300 : PALETTE.sipag500,
              opacity: sweep.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.85, 0.6, 0] }),
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: direction.current > 0 ? [width, -width * (0.6 + i * 0.08)] : [-width * 0.6, width * (1 + i * 0.08)],
                  }),
                },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
}
