import { Text, View } from 'react-native';

import type { GameState } from '@/lib/game/deriveState';

type LevelBarProps = { state: GameState };

/** Level name, Sipag (XP) bar, streak and Baon Days. Past level 3 the bar stays full with a "Malapit na" badge. */
export function LevelBar({ state }: LevelBarProps) {
  const { level, totalXp, streak } = state;
  return (
    <View className="gap-2 rounded-3xl bg-white p-4 shadow-sm">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-xl font-extrabold text-tara-900">
          Level {level.level} · {level.name}
        </Text>
        {level.pastCap ? <Text className="rounded-full bg-sipag-300 px-2 py-0.5 text-xs font-bold text-tara-900">Malapit na</Text> : null}
      </View>
      <View className="h-4 overflow-hidden rounded-full bg-banig-200">
        <View className="h-4 rounded-full bg-sipag-500" style={{ width: `${Math.round(level.progress * 100)}%` }} />
      </View>
      <View className="flex-row justify-between">
        <Text className="text-sm text-tara-700">
          {totalXp} Sipag (XP){level.nextXp !== null ? ` / ${level.nextXp}` : ''}
        </Text>
        <Text className="text-sm text-tara-700">
          Streak {streak.current} · {streak.multiplier}x{streak.baonDays > 0 ? ` · Baon ${streak.baonDays}` : ''}
        </Text>
      </View>
      {state.clockFlagged ? <Text className="text-xs text-tara-500">Nagbago ang oras ng phone. Babalik ang streak bukas. (Phone time changed.)</Text> : null}
    </View>
  );
}
