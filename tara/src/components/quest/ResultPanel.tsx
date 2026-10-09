import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { AvatarStage } from '@/components/avatar/AvatarStage';
import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { RULES } from '@/lib/game/constants';
import type { Award } from '@/lib/game/xp';
import { useT, type Translate } from '@/lib/i18n/translate';
import { tierName } from '@/lib/quests/questLook';
import { repeatLimitLine } from '@/lib/quests/repeatLimitLine';
import { PALETTE } from '@/lib/theme/palette';
import type { ProofTier, QuestType } from '@/types/gameEvents';
import type { CheckOutcome } from '@/types/quest';

// one color per tier, so the stamp alone says how strong the proof was
const STAMP: Record<ProofTier, { fill: string; stroke: string; times: number }> = {
  patunay: { fill: PALETTE.leaf100, stroke: PALETTE.leaf500, times: 3 },
  nakita: { fill: PALETTE.sipag300, stroke: PALETTE.sipag600, times: 2 },
  sabi_ko: { fill: PALETTE.banig100, stroke: PALETTE.tara500, times: 1 },
};

type ResultPanelProps = {
  outcome: CheckOutcome;
  /** XP this result would earn, already capped; null while not confirmed */
  xp: number | null;
  /** which daily limit cut the XP, so the panel can say why */
  capped: Award['capped'];
  questType: QuestType;
  minutes: number;
  multiplier: number;
  beforeUri?: string;
  afterUri?: string;
  canRetry: boolean;
  retryLabel: string;
  onAccept: () => void;
  onRetry: () => void;
  onDispute: () => void;
};

// says which limit applied; the quest always still counts as done
const capLine = (capped: NonNullable<Award['capped']>, questType: QuestType, t: Translate): string =>
  ({
    repeat_limit: repeatLimitLine(questType, 'after', t),
    daily_cap: t(`You reached today's ${RULES.dailyQuestCap} Sipag limit. This one still counts as done. Come back tomorrow!`, `Naabot mo na ang ${RULES.dailyQuestCap} Sipag ngayong araw. Bilang pa rin itong tapos. Balik bukas!`),
    sabi_ko_cap: t(`Today's ${RULES.sabiKoDailyCap} Sipag for "Sabi ko" proof is used up. A photo or quiz proof still earns more.`, `Naubos na ang ${RULES.sabiKoDailyCap} Sipag ngayon para sa "Sabi ko". May dagdag pa rin sa litrato o quiz.`),
  })[capped];

/**
 * The payoff. A confirmed quest shows the hero jumping on the quest-done burst, then the stamp drops, then the XP
 * math. A not-confirmed check shows what Tara saw and offers a retry and "I really did it" side by side, never a
 * warning.
 */
export function ResultPanel({ outcome, xp, capped, questType, minutes, multiplier, beforeUri, afterUri, canRetry, retryLabel, onAccept, onRetry, onDispute }: ResultPanelProps) {
  const t = useT();
  const drop = useRef(new Animated.Value(0)).current;
  const tier = outcome.verdict === 'patunay' || outcome.verdict === 'nakita' || outcome.verdict === 'sabi_ko' ? outcome.verdict : null;
  useEffect(() => {
    if (!tier) return;
    drop.setValue(0);
    Animated.sequence([Animated.delay(450), Animated.spring(drop, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 })]).start();
  }, [tier, drop]);

  const photos =
    beforeUri && afterUri ? (
      <View className="flex-row gap-2">
        <Image source={{ uri: beforeUri }} className="h-32 flex-1" />
        <Image source={{ uri: afterUri }} className="h-32 flex-1" />
      </View>
    ) : null;

  if (!tier) {
    return (
      <View className="gap-4">
        <Text className="font-pixel-bold text-2xl text-ink-900">{t('Tara could not confirm it yet', 'Hindi pa nakumpirma ni Tara')}</Text>
        {photos}
        <TaraBubble text={outcome.said} />
        {canRetry ? <Button label={retryLabel} variant="secondary" icon="camera" onPress={onRetry} /> : null}
        <Button label={t('I really did it', 'Ginawa ko talaga')} icon="check" onPress={onDispute} />
      </View>
    );
  }

  const look = STAMP[tier];
  return (
    <View className="gap-4">
      <Text className="text-center font-pixel-bold text-3xl text-ink-900">{t('Quest complete!', 'Tapos ang Gawain!')}</Text>
      <AvatarStage className="h-64" fx="quest_done_fx" celebrate />
      <Animated.View
        style={{ transform: [{ scale: drop.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) }, { rotate: '-4deg' }], opacity: drop }}
        className="-mt-10 self-center"
      >
        <PolyFrame cut={10} fill={look.fill} stroke={look.stroke} strokeWidth={3}>
          <View className="flex-row items-center gap-2 px-5 py-2.5">
            <PixelIcon name="check" size={22} color={look.stroke} />
            <Text className="font-pixel-bold text-2xl text-ink-900">{tierName(tier, t).toUpperCase()}</Text>
            <Text className="font-pixel text-base text-tara-700">{look.times}x</Text>
          </View>
        </PolyFrame>
      </Animated.View>
      {xp !== null ? (
        <View className="items-center gap-1">
          <Text className="text-sipag-600">
            <Text className="font-num text-4xl">+{xp}</Text>
            <Text className="font-pixel-bold text-xl"> Sipag</Text>
          </Text>
          <Text className="font-pixel text-sm text-tara-700">
            {minutes} min × {look.times} × {multiplier} streak
          </Text>
          {capped ? <Text className="text-center text-sm text-tara-700">{capLine(capped, questType, t)}</Text> : null}
        </View>
      ) : null}
      {photos}
      <TaraBubble text={outcome.said} />
      <Button label={t('Continue', 'Tuloy')} onPress={onAccept} />
    </View>
  );
}
