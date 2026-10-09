import { Tabs } from 'expo-router';

import { PixelIcon, type PixelIconName } from '@/components/poly/PixelIcon';
import { useT } from '@/lib/i18n/translate';
import { PALETTE } from '@/lib/theme/palette';

const tabIcon = (name: PixelIconName) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <PixelIcon name={name} size={22} color={focused ? PALETTE.ink900 : PALETTE.tara300} />;
  };

export default function MainTabs() {
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PALETTE.ink900,
        tabBarInactiveTintColor: PALETTE.tara300,
        tabBarStyle: { backgroundColor: PALETTE.banig50, borderTopColor: PALETTE.banig200, borderTopWidth: 1.5, paddingTop: 4 },
        tabBarLabelStyle: { fontFamily: 'PixelifySans_500Medium', fontSize: 13 },
      }}
    >
      <Tabs.Screen name="bahay" options={{ title: t('Home', 'Bahay'), tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="gawain" options={{ title: t('Quests', 'Gawain'), tabBarIcon: tabIcon('scroll') }} />
      <Tabs.Screen name="pabuya" options={{ title: t('Rewards', 'Pabuya'), tabBarIcon: tabIcon('chest') }} />
    </Tabs>
  );
}
