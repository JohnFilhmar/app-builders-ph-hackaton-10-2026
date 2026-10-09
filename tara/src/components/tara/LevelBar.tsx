import { Text, View } from 'react-native';

import { PolyFrame } from '@/components/poly/PolyFrame';
import type { GameState } from '@/lib/game/deriveState';
import { useT } from '@/lib/i18n/translate';
import { PALETTE } from '@/lib/theme/palette';

type LevelBarProps = { state: GameState; tone?: 'paper' | 'glass' };

const BLOCKS = 16;

/** Pixel block bar: progress fills whole blocks, like an old game's XP meter. */
export function BlockBar({ progress, blocks = BLOCKS }: { progress: number; blocks?: number }) {
  const lit = Math.round(Math.min(1, Math.max(0, progress)) * blocks);
  return (
    <View className="flex-row gap-0.5" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      {Array.from({ length: blocks }, (_, i) => (
        <View key={i} className={`h-3 flex-1 ${i < lit ? 'bg-sipag-500' : 'bg-banig-200'}`} />
      ))}
    </View>
  );
}

/** Level badge, name, Sipag (XP) block bar and the clock warning. Past level 3 the bar stays full with "Malapit na". */
export function LevelBar({ state, tone = 'paper' }: LevelBarProps) {
  const t = useT();
  const { level, totalXp } = state;
  return (
    <PolyFrame cut={12} fill={tone === 'glass' ? 'rgba(255,251,242,0.92)' : PALETTE.white} stroke={PALETTE.banig300}>
      <View className="gap-2 p-3.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-baseline gap-2">
            <Text className="font-pixel-bold text-2xl text-ink-900">Lv. {level.level}</Text>
            <Text className="font-pixel text-base text-tara-700">{level.name}</Text>
          </View>
          <Text className="font-pixel text-sm text-tara-700">
            {totalXp}
            {level.nextXp !== null ? ` / ${level.nextXp}` : ''} Sipag
          </Text>
        </View>
        <BlockBar progress={level.progress} />
        {level.pastCap ? <Text className="font-pixel text-sm text-sipag-600">{t('More levels soon', 'Malapit na ang susunod')}</Text> : null}
        {state.clockFlagged ? <Text className="text-sm text-tara-700">{t('Phone time changed. Your streak comes back tomorrow.', 'Nagbago ang oras ng phone. Babalik ang streak bukas.')}</Text> : null}
      </View>
    </PolyFrame>
  );
}
