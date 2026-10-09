import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { LEVELS } from '@/lib/game/constants';
import { heroArtFor } from '@/lib/hero/heroArt';
import { useT } from '@/lib/i18n/translate';
import { PALETTE } from '@/lib/theme/palette';

/**
 * All ten hero forms in two rows of five. Reached forms show in full, the current one is ringed in gold, and forms
 * still ahead show as dark silhouettes. Tapping a form explains it below the grid. A grid, not a horizontal scroller,
 * so a sideways drag can never fight the tab swipe.
 * @param level the player's current level
 * @param totalXp all XP earned, for "how far to this form"
 */
export function EvolutionGrid({ level, totalXp }: { level: number; totalXp: number }) {
  const t = useT();
  const [picked, setPicked] = useState(level);
  const form = LEVELS.find((l) => l.level === picked) ?? LEVELS[0];
  const [rank_tl, rank_en] = form.name.split(' · ');
  const isReached = picked <= level;

  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap justify-between gap-y-2">
        {LEVELS.map((l) => {
          const isLocked = l.level > level;
          const isCurrent = l.level === level;
          const isPicked = l.level === picked;
          return (
            <Pressable key={l.level} accessibilityRole="button" accessibilityLabel={`Level ${l.level}${isLocked ? ', locked' : ''}`} onPress={() => setPicked(l.level)} className="w-[19%]">
              <PolyFrame cut={6} fill={isLocked ? PALETTE.banig200 : PALETTE.white} stroke={isCurrent ? PALETTE.sipag500 : isPicked ? PALETTE.tara500 : PALETTE.banig300} strokeWidth={isCurrent || isPicked ? 3 : 2}>
                <View className="items-center p-1">
                  <View className="h-16 w-full items-center justify-center">
                    <Image source={heroArtFor(l.level)} resizeMode="contain" className="h-16 w-full" style={isLocked ? { tintColor: PALETTE.ink700, opacity: 0.75 } : undefined} />
                    {isLocked ? (
                      <View className="absolute">
                        <PixelIcon name="lock" size={16} color={PALETTE.sipag300} />
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-num text-xs text-ink-900">Lv.{l.level}</Text>
                </View>
              </PolyFrame>
            </Pressable>
          );
        })}
      </View>
      <PolyFrame cut={10} fill={PALETTE.white} stroke={PALETTE.banig300}>
        <View className="gap-1 p-3">
          <Text className="font-pixel-bold text-lg text-ink-900">
            Lv. {form.level} · {rank_tl}
          </Text>
          {rank_en ? <Text className="text-sm text-tara-700">{rank_en}</Text> : null}
          <Text className="text-sm text-tara-700">
            {isReached
              ? picked === level
                ? t('Your current form.', 'Ang anyo mo ngayon.')
                : t('A form you already reached.', 'Naabot mo na ang anyong ito.')
              : t(`Unlocks at ${form.xp} Sipag. ${form.xp - totalXp} to go.`, `Bubukas sa ${form.xp} Sipag. ${form.xp - totalXp} pa.`)}
          </Text>
        </View>
      </PolyFrame>
    </View>
  );
}
