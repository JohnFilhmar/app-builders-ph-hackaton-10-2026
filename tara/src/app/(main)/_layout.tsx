import { Tabs } from 'expo-router';

export default function MainTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5C3A1A',
        tabBarInactiveTintColor: '#C79A6B',
        tabBarStyle: { backgroundColor: '#FDF2DC', borderTopColor: '#F6E2B8' },
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 16, fontWeight: '800' },
        tabBarLabelPosition: 'beside-icon',
      }}
    >
      <Tabs.Screen name="bahay" options={{ title: 'Bahay' }} />
      <Tabs.Screen name="gawain" options={{ title: 'Gawain' }} />
      <Tabs.Screen name="pabuya" options={{ title: 'Pabuya' }} />
    </Tabs>
  );
}
