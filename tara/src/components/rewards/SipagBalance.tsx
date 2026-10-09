import { Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { useT } from '@/lib/i18n/translate';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';

/** The dark card showing how much Sipag is left to spend, shared by the Shop and Rewards tabs. */
export function SipagBalance() {
  const t = useT();
  const balance = useGameStore((s) => s.state.pabuyaBalance);
  return (
    <PolyFrame cut={14} fill={PALETTE.ink900} depth={5} depthColor={PALETTE.tara700}>
      <View className="flex-row items-center gap-3 p-4">
        <PixelIcon name="chest" size={36} color={PALETTE.sipag400} />
        <View className="flex-1">
          <Text className="font-pixel text-sm text-sipag-300">{t('Sipag to spend', 'Sipag na magagastos')}</Text>
          <Text className="text-banig-50">
            <Text className="font-num text-4xl">{balance}</Text>
            <Text className="font-pixel text-lg text-sipag-300"> Sipag</Text>
          </Text>
        </View>
      </View>
    </PolyFrame>
  );
}
