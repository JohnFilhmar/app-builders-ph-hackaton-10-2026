import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSetupStore } from '@/lib/stores/setupStore';

/** First stop: send a fresh install to setup, everyone else home. */
export default function Gate() {
  const hasHydrated = useSetupStore((s) => s.hasHydrated);
  const isSetupDone = useSetupStore((s) => s.isSetupDone);
  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-banig-50">
        <ActivityIndicator color="#8B5A2B" />
      </View>
    );
  }
  return <Redirect href={isSetupDone ? '/bahay' : '/setup'} />;
}
