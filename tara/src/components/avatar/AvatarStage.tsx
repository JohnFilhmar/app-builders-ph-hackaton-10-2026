import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { HeroBurst } from '@/components/avatar/HeroBurst';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { HeroFx } from '@/components/scene/HeroFx';
import { heroArtFor } from '@/lib/hero/heroArt';
import { useHeroStore } from '@/lib/hero/heroReactions';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';
import type { HeroReaction } from '@/types/hero';

const EVOLVE_MS = 700;

type AvatarStageProps = {
  className?: string;
  /** effect drawn behind the hero: its aura, or a celebration burst */
  fx?: 'aura' | 'level_up_fx' | 'quest_done_fx';
  /** celebrate once as soon as the hero shows: quest_done, or level_up when fx is level_up_fx */
  celebrate?: boolean;
  /** the level the player just left: its art cross-fades into the current level's art */
  evolveFrom?: number;
  /** equipped aura item, drawn in place of the default gold aura */
  auraItem?: string | null;
};

/** Squash, lift off by `hop` points, land with a small squash. */
function hopOnce(lift: SharedValue<number>, squash: SharedValue<number>, hop: number) {
  squash.value = withSequence(withTiming(0.9, { duration: 110 }), withTiming(1.06, { duration: 160 }), withTiming(1, { duration: 250 }), withTiming(0.94, { duration: 80 }), withTiming(1, { duration: 100 }));
  lift.value = withSequence(withTiming(0, { duration: 110 }), withTiming(-hop, { duration: 250, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 230, easing: Easing.in(Easing.quad) }));
}

/**
 * The player's hero: the full-body art for their current level. It breathes while idle and plays whatever the hero
 * store asks for: a hop on tap, a sway while Tara thinks, a head shake on errors, and a jump with a gold burst for
 * achievements, finished quests and level ups. Motion runs only while the screen is focused and the app is in the
 * foreground, and stays off when the system asks for reduced motion.
 */
export function AvatarStage({ className, fx, celebrate = false, evolveFrom, auraItem = null }: AvatarStageProps) {
  const level = useGameStore((s) => s.state.level.level);
  const reaction = useHeroStore((s) => s.reaction);
  const nonce = useHeroStore((s) => s.nonce);
  const play = useHeroStore((s) => s.play);
  const isReducedMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(true);
  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');
  const [height, setHeight] = useState(0);
  const [fxSize, setFxSize] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const mountNonce = useRef(nonce);
  const breath = useSharedValue(0);
  const lift = useSharedValue(0);
  const squash = useSharedValue(1);
  const tilt = useSharedValue(0);
  const shake = useSharedValue(0);
  const oldArt = useSharedValue(evolveFrom && evolveFrom !== level ? 1 : 0);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setIsForeground(s === 'active'));
    return () => sub.remove();
  }, []);

  const isLive = isFocused && isForeground && !isReducedMotion;
  useEffect(() => {
    if (!isLive) return;
    breath.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [isLive, breath]);

  const animate = useCallback(
    (r: HeroReaction) => {
      const h = height;
      if (r === 'thinking') {
        tilt.value = withRepeat(withSequence(withTiming(-4, { duration: 650 }), withTiming(4, { duration: 650 })), -1, true);
        return;
      }
      tilt.value = withTiming(0, { duration: 200 });
      if (r === 'tap') hopOnce(lift, squash, h * 0.12);
      else if (r === 'happy') {
        hopOnce(lift, squash, h * 0.07);
        lift.value = withDelay(450, withSequence(withTiming(-h * 0.06, { duration: 180 }), withTiming(0, { duration: 180 })));
      } else if (r === 'error') {
        shake.value = withSequence(...[-10, 10, -8, 8, -4, 0].map((x) => withTiming(x, { duration: 70 })));
        tilt.value = withSequence(withTiming(-6, { duration: 150 }), withDelay(300, withTiming(0, { duration: 200 })));
      } else {
        hopOnce(lift, squash, h * (r === 'achievement' ? 0.15 : 0.2));
        setBurstKey((k) => k + 1);
      }
    },
    [height, lift, squash, tilt, shake],
  );

  // play what the store asks for, except whatever was already playing when this hero mounted
  useEffect(() => {
    if (nonce === mountNonce.current || !isLive) return;
    if (reaction) animate(reaction);
    else tilt.value = withTiming(0, { duration: 200 });
  }, [nonce, reaction, isLive, animate, tilt]);

  const isEvolving = evolveFrom !== undefined && evolveFrom !== level;
  useEffect(() => {
    if (!isEvolving) return;
    oldArt.value = withDelay(500, withTiming(0, { duration: EVOLVE_MS }));
    const timer = setTimeout(() => setBurstKey((k) => k + 1), 500);
    return () => clearTimeout(timer);
  }, [isEvolving, oldArt]);

  useEffect(() => {
    if (!celebrate || height === 0) return;
    const timer = setTimeout(() => play(fx === 'level_up_fx' ? 'level_up' : 'quest_done'), isEvolving ? 500 + EVOLVE_MS + 150 : 350);
    return () => clearTimeout(timer);
  }, [celebrate, height, fx, isEvolving, play]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value },
      { translateY: lift.value },
      { rotate: `${tilt.value}deg` },
      { scaleX: 2 - squash.value - breath.value * 0.008 },
      { scaleY: squash.value + breath.value * 0.022 },
    ],
  }));
  const newArtStyle = useAnimatedStyle(() => ({ opacity: 1 - oldArt.value, transform: [{ scale: 1 - oldArt.value * 0.12 }] }));
  const oldArtStyle = useAnimatedStyle(() => ({ opacity: oldArt.value }));

  return (
    <View
      className={className}
      onLayout={(e) => {
        setHeight(e.nativeEvent.layout.height);
        setFxSize(Math.min(e.nativeEvent.layout.width, e.nativeEvent.layout.height) * 0.95);
      }}
    >
      {fx && fxSize > 0 ? (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <HeroFx slot={fx} size={fxSize} auraItem={auraItem} />
        </View>
      ) : null}
      <Animated.View className="h-full w-full" style={[{ transformOrigin: 'bottom' }, heroStyle]}>
        <Animated.Image source={heroArtFor(level)} resizeMode="contain" className="h-full w-full" style={newArtStyle} />
        {isEvolving ? <Animated.Image source={heroArtFor(evolveFrom)} resizeMode="contain" className="absolute inset-0 h-full w-full" style={oldArtStyle} /> : null}
      </Animated.View>
      {isLive ? <HeroBurst burstKey={burstKey} radius={fxSize * 0.5} /> : null}
      {reaction === 'thinking' ? (
        <View className="absolute left-3 top-3" pointerEvents="none">
          <PolyFrame cut={6} fill={PALETTE.white} stroke={PALETTE.banig300}>
            <Text className="px-3 py-1 font-pixel-bold text-lg text-ink-900">...</Text>
          </PolyFrame>
        </View>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Tap your hero to jump" onPress={() => play('tap')} className="absolute inset-0" />
    </View>
  );
}
