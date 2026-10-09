import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type CardProps = { title?: string; children: ReactNode };

/** Bordered group of related controls. */
export function Card({ title, children }: CardProps) {
  return (
    <View className="gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {title ? <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{title}</Text> : null}
      {children}
    </View>
  );
}
