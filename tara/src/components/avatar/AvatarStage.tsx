import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { HeroFx } from '@/components/scene/HeroFx';
import { heroArtFor } from '@/lib/hero/heroArt';
import { useGameStore } from '@/lib/stores/gameStore';

const JUMP_MS = 700;

type AvatarStageProps = {
  className?: string;
  /** effect drawn behind the hero: its aura, or a celebration burst */
  fx?: 'aura' | 'level_up_fx' | 'quest_done_fx';
  /** jump once as soon as the hero shows, for celebration screens */
  celebrate?: boolean;
};

/**
 * The player's hero: the full-body art for their current level. It breathes while idle; a tap plays a squash and
 * jump, and further taps are ignored until it lands. Motion pauses while the screen is unfocused or the app is in the
 * background, and stays off when the system asks for reduced motion.
 */
export function AvatarStage({ className, fx, celebrate = false }: AvatarStageProps) {
  const level = useGameStore((s) => s.state.level.level);
  const isReducedMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(true);
  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');
  const [height, setHeight] = useState(0);
  const [fxSize, setFxSize] = useState(0);
  const busyUntil = useRef(0);
  const breath = useSharedValue(0);
  const lift = useSharedValue(0);
  const squash = useSharedValue(1);

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

  const isIdleRunning = isFocused && isForeground && !isReducedMotion;
  useEffect(() => {
    if (!isIdleRunning) return;
    breath.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [isIdleRunning, breath]);

  const jump = useCallback(
    (hop: number) => {
      const now = Date.now();
      if (now < busyUntil.current || isReducedMotion) return;
      busyUntil.current = now + JUMP_MS;
      squash.value = withSequence(
        withTiming(0.9, { duration: 110 }),
        withTiming(1.06, { duration: 160 }),
        withTiming(1, { duration: 250 }),
        withTiming(0.94, { duration: 80 }),
        withTiming(1, { duration: 100 }),
      );
      lift.value = withSequence(
        withTiming(0, { duration: 110 }),
        withTiming(-hop, { duration: 250, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 230, easing: Easing.in(Easing.quad) }),
      );
    },
    [isReducedMotion, lift, squash],
  );

  useEffect(() => {
    if (!celebrate || height === 0) return;
    const timer = setTimeout(() => jump(height * 0.2), 350);
    return () => clearTimeout(timer);
  }, [celebrate, height, jump]);

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scaleX: 2 - squash.value - breath.value * 0.008 }, { scaleY: squash.value + breath.value * 0.022 }],
  }));

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
          <HeroFx slot={fx} size={fxSize} />
        </View>
      ) : null}
      <Animated.Image source={heroArtFor(level)} resizeMode="contain" className="h-full w-full" style={[{ transformOrigin: 'bottom' }, heroStyle]} />
      <Pressable accessibilityRole="button" accessibilityLabel="Tap your hero to jump" onPress={() => jump(height * 0.12)} className="absolute inset-0" />
    </View>
  );
}
