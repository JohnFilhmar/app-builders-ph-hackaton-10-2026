import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PolyFrame } from '@/components/poly/PolyFrame';
import { useT } from '@/lib/i18n/translate';
import { useThoughtStore } from '@/lib/stores/thoughtStore';
import { PALETTE } from '@/lib/theme/palette';

const TAIL = 420;

type TaraThoughtsProps = {
  /** finished thoughts to show collapsed under an answer; without it the box follows the live thoughts */
  text?: string;
};

/**
 * Tara's reasoning from a laptop model that is allowed to think. Live, it shows the newest lines as they stream in;
 * under a finished answer it starts collapsed and opens on tap. Draws nothing when there are no thoughts.
 */
export function TaraThoughts({ text }: TaraThoughtsProps) {
  const t = useT();
  const live = useThoughtStore((s) => s.text);
  const [isOpen, setIsOpen] = useState(false);
  const isLive = text === undefined;
  const thoughts = (isLive ? live : text).trim();
  if (!thoughts) return null;
  const shown = isLive ? (thoughts.length > TAIL ? `...${thoughts.slice(-TAIL)}` : thoughts) : thoughts;

  return (
    <Pressable accessibilityRole="button" disabled={isLive} onPress={() => setIsOpen((o) => !o)}>
      <PolyFrame cut={8} fill={PALETTE.banig100} stroke={PALETTE.banig300}>
        <View className="gap-1 px-3 py-2">
          <Text className="font-pixel text-xs text-tara-700">
            {isLive ? t('Tara is thinking...', 'Nag-iisip si Tara...') : isOpen ? t("Hide Tara's thoughts", 'Itago ang iniisip ni Tara') : t("Show Tara's thoughts", 'Ipakita ang iniisip ni Tara')}
          </Text>
          {isLive || isOpen ? <Text className="text-xs italic leading-5 text-tara-700">{shown}</Text> : null}
        </View>
      </PolyFrame>
    </Pressable>
  );
}
