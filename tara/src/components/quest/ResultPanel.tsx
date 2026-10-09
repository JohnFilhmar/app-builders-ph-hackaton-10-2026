import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TaraBubble } from '@/components/tara/TaraBubble';
import type { ProofTier } from '@/types/gameEvents';
import type { CheckOutcome } from '@/types/quest';

const STAMP: Record<ProofTier, { label: string; english: string; tone: string }> = {
  patunay: { label: 'PATUNAY', english: 'Proof · 3x', tone: 'border-sipag-500 bg-sipag-300' },
  nakita: { label: 'NAKITA', english: 'Seen · 2x', tone: 'border-leaf-500 bg-leaf-100' },
  sabi_ko: { label: 'SABI KO', english: 'Your word · 1x', tone: 'border-tara-300 bg-banig-100' },
};

type ResultPanelProps = {
  outcome: CheckOutcome;
  /** XP this result would earn, already capped; null while not confirmed */
  xp: number | null;
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

/** What Tara saw and what it earns. A not-confirmed check offers a retry and "Ginawa ko talaga" side by side, with no warning. */
export function ResultPanel({ outcome, xp, minutes, multiplier, beforeUri, afterUri, canRetry, retryLabel, onAccept, onRetry, onDispute }: ResultPanelProps) {
  const drop = useRef(new Animated.Value(0)).current;
  const tier = outcome.verdict === 'patunay' || outcome.verdict === 'nakita' || outcome.verdict === 'sabi_ko' ? outcome.verdict : null;
  useEffect(() => {
    if (!tier) return;
    drop.setValue(0);
    Animated.spring(drop, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [tier, drop]);

  return (
    <View className="gap-4">
      {beforeUri && afterUri ? (
        <View className="flex-row gap-2">
          <Image source={{ uri: beforeUri }} className="h-36 flex-1 rounded-2xl" />
          <Image source={{ uri: afterUri }} className="h-36 flex-1 rounded-2xl" />
        </View>
      ) : null}
      {tier ? (
        <Animated.View
          style={{ transform: [{ scale: drop.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) }, { rotate: '-6deg' }], opacity: drop }}
          className={`self-center rounded-2xl border-4 px-6 py-3 ${STAMP[tier].tone}`}
        >
          <Text className="text-center text-3xl font-black text-tara-900">{STAMP[tier].label} ✓</Text>
          <Text className="text-center text-sm font-bold text-tara-700">{STAMP[tier].english}</Text>
        </Animated.View>
      ) : null}
      <TaraBubble text={outcome.said} />
      {tier && xp !== null ? (
        <Text className="text-center text-base text-tara-700">
          {minutes} min × {tier === 'patunay' ? 3 : tier === 'nakita' ? 2 : 1} × {multiplier} streak = +{xp} Sipag
        </Text>
      ) : null}
      {tier ? (
        <Button label="Ayos! (Done)" onPress={onAccept} />
      ) : (
        <View className="gap-3">
          {canRetry ? <Button label={retryLabel} variant="secondary" onPress={onRetry} /> : null}
          <Button label="Ginawa ko talaga (I really did it)" onPress={onDispute} />
        </View>
      )}
    </View>
  );
}
