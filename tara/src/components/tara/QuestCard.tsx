import { Pressable, Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { useT } from '@/lib/i18n/translate';
import { QUEST_ICON, questName, tierName } from '@/lib/quests/questLook';
import { PALETTE } from '@/lib/theme/palette';
import type { ProofTier, QuestType } from '@/types/gameEvents';

type QuestCardProps = { title: string; questType: QuestType; minutes: number; status: 'open' | 'done'; xp?: number; tier?: ProofTier; onPress?: () => void };

/** One quest row: type icon tile, title and meta, then a Start chip (open) or the earned tier and XP (done). */
export function QuestCard({ title, questType, minutes, status, xp, tier, onPress }: QuestCardProps) {
  const t = useT();
  const isDone = status === 'done';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={isDone}>
      {({ pressed }) => (
        <PolyFrame cut={12} fill={isDone ? PALETTE.leaf100 : pressed ? PALETTE.banig100 : PALETTE.white} stroke={isDone ? '#BFE3CC' : PALETTE.banig300}>
          <View className="flex-row items-center gap-3 p-3">
            <PolyFrame cut={8} fill={isDone ? PALETTE.leaf500 : PALETTE.banig100}>
              <View className="h-12 w-12 items-center justify-center">
                <PixelIcon name={isDone ? 'check' : QUEST_ICON[questType]} size={24} color={isDone ? PALETTE.white : PALETTE.tara700} />
              </View>
            </PolyFrame>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-bold text-ink-900" numberOfLines={2}>
                {title}
              </Text>
              <Text className="text-sm text-tara-700">
                {questName(questType, t)} · {minutes} min
              </Text>
            </View>
            {isDone ? (
              <View className="items-end">
                <Text className="font-pixel text-xs text-leaf-700">{tier ? tierName(tier, t).toUpperCase() : ''}</Text>
                <Text className="font-pixel-bold text-xl text-leaf-700">+{xp ?? 0}</Text>
              </View>
            ) : (
              <PolyFrame cut={6} fill={PALETTE.ink900}>
                <Text className="px-3 py-2 font-pixel-bold text-sm text-banig-50">{t('Start', 'Simulan')}</Text>
              </PolyFrame>
            )}
          </View>
        </PolyFrame>
      )}
    </Pressable>
  );
}
