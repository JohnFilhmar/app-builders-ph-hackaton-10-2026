import { Text, View } from 'react-native';

import { HeroScene } from '@/components/avatar/HeroScene';
import { EvolutionGrid } from '@/components/hero/EvolutionGrid';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { ItemShop } from '@/components/rewards/ItemShop';
import { SipagBalance } from '@/components/rewards/SipagBalance';
import { BlockBar } from '@/components/tara/LevelBar';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { useT } from '@/lib/i18n/translate';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';

/** The Character tab: the hero in its equipped look, progress to the next form, every form, and the item shop. */
export default function Bida() {
  const t = useT();
  const state = useGameStore((s) => s.state);
  const { level } = state;
  const [rank_tl, rank_en] = level.name.split(' · ');

  return (
    <TaraScreen title={t('Your hero', 'Ang bida mo')} subtitle={t('Your hero grows a new form as you level up.', 'May bagong anyo ang bida mo sa bawat level.')}>
      <PolyFrame cut={14} fill={PALETTE.banig100} stroke={PALETTE.banig300} strokeWidth={2.5}>
        <HeroScene className="h-96 overflow-hidden">
          <View className="absolute left-3 top-3" pointerEvents="none">
            <PolyFrame cut={8} fill="rgba(255,251,242,0.94)" stroke={PALETTE.banig300}>
              <View className="px-3 py-2">
                <Text className="font-pixel-bold text-2xl text-ink-900">
                  Lv. <Text className="font-num">{level.level}</Text>
                </Text>
                <Text className="font-pixel text-sm text-tara-700">{rank_tl}</Text>
                {rank_en ? <Text className="text-xs text-tara-700">{rank_en}</Text> : null}
              </View>
            </PolyFrame>
          </View>
        </HeroScene>
      </PolyFrame>

      <PolyFrame cut={12} fill={PALETTE.white} stroke={PALETTE.banig300} strokeWidth={2.5}>
        <View className="gap-2 p-4">
          <Text className="text-center font-num text-lg text-ink-900">
            {state.totalXp}
            {level.nextXp !== null ? ` / ${level.nextXp}` : ''} Sipag
          </Text>
          <BlockBar progress={level.progress} blocks={14} />
          <Text className="text-center text-sm text-tara-700">
            {level.nextXp !== null
              ? t(`${level.nextXp - state.totalXp} Sipag until your next form`, `${level.nextXp - state.totalXp} Sipag pa bago ang susunod na anyo`)
              : t('Every form unlocked. Alamat ka na!', 'Bukas na ang lahat ng anyo. Alamat ka na!')}
          </Text>
        </View>
      </PolyFrame>

      <Text className="pt-2 font-pixel-bold text-xl text-ink-900">{t('Evolution', 'Ebolusyon')}</Text>
      <EvolutionGrid level={level.level} totalXp={state.totalXp} />

      <Text className="pt-2 font-pixel-bold text-xl text-ink-900">{t('Shop', 'Tindahan')}</Text>
      <Text className="text-sm text-tara-700">{t('Backdrops, frames and auras. What you buy, your hero wears right away.', 'Tanawin, kuwadro at aura. Ang mabibili mo, isusuot agad ng bida.')}</Text>
      <SipagBalance />
      <ItemShop />
    </TaraScreen>
  );
}
