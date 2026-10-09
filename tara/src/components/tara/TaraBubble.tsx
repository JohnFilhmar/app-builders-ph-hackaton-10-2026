import { ActivityIndicator, Text, View } from 'react-native';

import { PolyFrame } from '@/components/poly/PolyFrame';
import { TaraFace } from '@/components/tara/TaraFace';
import { PALETTE } from '@/lib/theme/palette';

type TaraBubbleProps = { text: string; isThinking?: boolean };

/** Tara the tarsier speaking. While thinking, a spinner shows so a slow model never looks frozen. */
export function TaraBubble({ text, isThinking = false }: TaraBubbleProps) {
  return (
    <View className="flex-row items-start gap-3">
      <TaraFace size={48} />
      <PolyFrame cut={10} fill={PALETTE.white} stroke={PALETTE.banig300} className="flex-1">
        <View className="flex-row items-center gap-2 px-4 py-3">
          {isThinking ? <ActivityIndicator color={PALETTE.tara500} /> : null}
          <Text className="flex-1 text-base leading-6 text-ink-900">{text}</Text>
        </View>
      </PolyFrame>
    </View>
  );
}
