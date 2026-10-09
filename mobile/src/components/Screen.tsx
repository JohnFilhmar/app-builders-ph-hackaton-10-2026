import type { ReactNode } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = { title: string; subtitle?: string; children: ReactNode };

/** Scrollable tab screen with safe-area padding and a heading. */
export function Screen({ title, subtitle, children }: ScreenProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScrollView contentContainerClassName="gap-4 p-4 pb-16" keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{title}</Text>
        {subtitle ? <Text className="-mt-3 text-sm text-neutral-500">{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
