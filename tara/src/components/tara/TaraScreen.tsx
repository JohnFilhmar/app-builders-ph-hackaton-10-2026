import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TaraScreenProps = { title?: string; subtitle?: string; children: ReactNode; scroll?: boolean };

/** Warm banig-colored screen with optional heading. */
export function TaraScreen({ title, subtitle, children, scroll = true }: TaraScreenProps) {
  const heading = title ? (
    <View className="gap-1">
      <Text className="text-3xl font-extrabold text-tara-900">{title}</Text>
      {subtitle ? <Text className="text-base text-tara-500">{subtitle}</Text> : null}
    </View>
  ) : null;
  return (
    <SafeAreaView edges={scroll ? ['top'] : ['top', 'bottom']} className="flex-1 bg-banig-50">
      {scroll ? (
        <ScrollView contentContainerClassName="gap-4 p-4 pb-20" keyboardShouldPersistTaps="handled">
          {heading}
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 gap-4 p-4">
          {heading}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
