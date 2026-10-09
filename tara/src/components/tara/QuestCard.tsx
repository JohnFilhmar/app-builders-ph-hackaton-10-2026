import { Pressable, Text, View } from 'react-native';

import { QUEST_INFO } from '@/lib/quests/questTypes';
import type { QuestType } from '@/types/gameEvents';

type QuestCardProps = { title: string; questType: QuestType; minutes: number; status: 'open' | 'done'; xp?: number; tier?: string; onPress?: () => void };

const TIER_LABEL: Record<string, string> = { patunay: 'PATUNAY', nakita: 'NAKITA', sabi_ko: 'SABI KO' };

/** One quest in a list: open quests start on tap, done quests show their tier stamp and XP. */
export function QuestCard({ title, questType, minutes, status, xp, tier, onPress }: QuestCardProps) {
  const info = QUEST_INFO[questType];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={status === 'done'}
      className={`flex-row items-center gap-3 rounded-2xl p-4 ${status === 'done' ? 'bg-leaf-100' : 'bg-white active:bg-banig-100'}`}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-bold text-tara-900">{title}</Text>
        <Text className="text-sm text-tara-500">
          {info.label} ({info.english}) · {minutes} min
        </Text>
      </View>
      {status === 'done' ? (
        <View className="items-end">
          <Text className="text-xs font-extrabold text-leaf-700">{tier ? TIER_LABEL[tier] : ''}</Text>
          <Text className="text-base font-bold text-leaf-700">+{xp ?? 0}</Text>
        </View>
      ) : (
        <Text className="rounded-full bg-sipag-400 px-3 py-1.5 text-sm font-bold text-tara-900">Simulan</Text>
      )}
    </Pressable>
  );
}
