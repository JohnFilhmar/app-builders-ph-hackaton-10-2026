import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type CardProps = { title?: string; children: ReactNode };

/** Bordered group of related controls. */
export function Card({ title, children }: CardProps) {
  return (
    <View className="gap-3 rounded-2xl border border-banig-200 bg-white p-4">
      {title ? <Text className="text-base font-semibold text-tara-900">{title}</Text> : null}
      {children}
    </View>
  );
}
