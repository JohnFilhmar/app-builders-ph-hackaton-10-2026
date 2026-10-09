import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const isDark = useColorScheme() === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: isDark ? '#a3a3a3' : '#525252',
        tabBarStyle: { backgroundColor: isDark ? '#0a0a0a' : '#ffffff', borderTopColor: isDark ? '#262626' : '#e5e5e5' },
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 14, fontWeight: '600' },
        tabBarLabelPosition: 'beside-icon',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Models' }} />
      <Tabs.Screen name="text" options={{ title: 'Text' }} />
      <Tabs.Screen name="voice" options={{ title: 'Voice' }} />
      <Tabs.Screen name="vision" options={{ title: 'Vision' }} />
      <Tabs.Screen name="assets" options={{ title: 'Assets' }} />
    </Tabs>
  );
}
