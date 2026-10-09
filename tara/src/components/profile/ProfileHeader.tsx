import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { PixelIcon, type PixelIconName } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { heroArtFor } from '@/lib/hero/heroArt';
import { useT } from '@/lib/i18n/translate';
import { useGameStore } from '@/lib/stores/gameStore';
import { useLeaderboardStore } from '@/lib/stores/leaderboardStore';
import { useSetupStore } from '@/lib/stores/setupStore';
import { PALETTE } from '@/lib/theme/palette';

function Stat({ icon, value, label }: { icon: PixelIconName; value: number; label: string }) {
  return (
    <View className="w-[48.5%]">
      <PolyFrame cut={8} fill={PALETTE.white} stroke={PALETTE.banig300}>
        <View className="items-center gap-1 p-3">
          <PixelIcon name={icon} size={18} color={PALETTE.sipag600} />
          <Text className="font-num text-2xl text-ink-900">{value}</Text>
          <Text className="text-xs text-tara-700">{label}</Text>
        </View>
      </PolyFrame>
    </View>
  );
}

/**
 * Top of the Profile tab: the hero's face for the current level, the player's names and rank, four real stats from
 * the ledger, and the way into AI settings.
 */
export function ProfileHeader() {
  const t = useT();
  const state = useGameStore((s) => s.state);
  const questsDone = useGameStore((s) => s.events.filter((e) => e.type === 'quest_completed').length);
  const heroName = useSetupStore((s) => s.heroName);
  const username = useLeaderboardStore((s) => s.username);
  const [rank_tl, rank_en] = state.level.name.split(' · ');

  return (
    <View className="gap-3">
      <PolyFrame cut={14} fill={PALETTE.ink900} depth={5} depthColor={PALETTE.tara700}>
        <View className="flex-row items-center gap-3 p-4">
          {/* box and image share plain dp (not rem classes) so the crop ratio holds: hair to chin of the full-body art */}
          <View className="overflow-hidden bg-banig100" style={{ width: 96, height: 96 }}>
            <Image source={heroArtFor(state.level.level)} resizeMode="contain" style={{ position: 'absolute', width: 180, height: 180, left: -42, top: 0 }} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-pixel-bold text-2xl text-banig-50">{heroName || t('Hero', 'Bida')}</Text>
            {username ? <Text className="text-sm text-sipag-300">@{username}</Text> : null}
            <Text className="font-pixel text-sm text-sipag-300">
              Lv. {state.level.level} · {rank_tl}
              {rank_en ? ` (${rank_en})` : ''}
            </Text>
          </View>
        </View>
      </PolyFrame>
      <View className="flex-row flex-wrap justify-between gap-y-2">
        <Stat icon="star" value={state.totalXp} label={t('Total Sipag', 'Kabuuang Sipag')} />
        <Stat icon="check" value={questsDone} label={t('Quests done', 'Natapos na Gawain')} />
        <Stat icon="flame" value={state.streak.current} label={t('Current streak', 'Streak ngayon')} />
        <Stat icon="trophy" value={state.streak.best} label={t('Longest streak', 'Pinakamahabang streak')} />
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/ai-settings')}>
        <PolyFrame cut={8} fill={PALETTE.white} stroke={PALETTE.banig300}>
          <View className="flex-row items-center gap-3 p-3.5">
            <PixelIcon name="gear" size={20} color={PALETTE.ink900} />
            <Text className="flex-1 text-base font-bold text-ink-900">{t('AI settings', 'AI settings')}</Text>
            <PixelIcon name="arrow" size={16} color={PALETTE.tara500} />
          </View>
        </PolyFrame>
      </Pressable>
    </View>
  );
}
