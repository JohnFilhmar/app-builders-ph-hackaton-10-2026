import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PALETTE } from '@/lib/theme/palette';

type TaraScreenProps = { title?: string; subtitle?: string; children: ReactNode; scroll?: boolean; canGoBack?: boolean };

/** Parchment screen with a pixel-font heading and an optional back arrow. */
export function TaraScreen({ title, subtitle, children, scroll = true, canGoBack = false }: TaraScreenProps) {
  const heading =
    title || canGoBack ? (
      <View className="gap-1.5">
        {canGoBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/bahay'))} className="-ml-2 h-11 w-11 items-center justify-center">
            <PixelIcon name="back" size={22} color={PALETTE.ink900} />
          </Pressable>
        ) : null}
        {title ? <Text className="font-pixel-bold text-3xl leading-9 text-ink-900">{title}</Text> : null}
        {subtitle ? <Text className="text-base leading-6 text-tara-700">{subtitle}</Text> : null}
      </View>
    ) : null;
  return (
    <SafeAreaView edges={scroll ? ['top'] : ['top', 'bottom']} className="flex-1 bg-banig-50">
      {scroll ? (
        <ScrollView contentContainerClassName="gap-4 px-4 pb-24 pt-2" keyboardShouldPersistTaps="handled">
          {heading}
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 gap-4 px-4 pb-4 pt-2">
          {heading}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
