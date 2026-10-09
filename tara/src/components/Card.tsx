import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { PolyFrame } from '@/components/poly/PolyFrame';
import { PALETTE } from '@/lib/theme/palette';

type CardProps = { title?: string; children: ReactNode; tone?: 'paper' | 'ink' };

/** Chamfered panel for a group of related content. */
export function Card({ title, children, tone = 'paper' }: CardProps) {
  const isInk = tone === 'ink';
  return (
    <PolyFrame cut={12} fill={isInk ? PALETTE.ink900 : PALETTE.white} stroke={isInk ? undefined : PALETTE.banig300}>
      <View className="gap-3 p-4">
        {title ? <Text className={`font-pixel-bold text-lg ${isInk ? 'text-banig-50' : 'text-ink-900'}`}>{title}</Text> : null}
        {children}
      </View>
    </PolyFrame>
  );
}
