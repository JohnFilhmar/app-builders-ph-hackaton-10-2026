import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { SCENE_ART } from '@/lib/theme/sceneArt';
import { PALETTE } from '@/lib/theme/palette';

type HeroFxProps = { slot: 'aura' | 'level_up_fx' | 'quest_done_fx'; size: number };

/** Gold shard ray: a thin kite from the centre outwards, rotated into place. */
const ray = (angle: number, inner: number, outer: number, half: number) => {
  const rad = (a: number) => (a * Math.PI) / 180;
  const pt = (r: number, a: number) => `${50 + r * Math.cos(rad(a))},${50 + r * Math.sin(rad(a))}`;
  return [pt(inner, angle), pt((inner + outer) / 2, angle - half), pt(outer, angle), pt((inner + outer) / 2, angle + half)].join(' ');
};

const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

/**
 * Effect drawn behind the hero: its aura, the level-up burst or the quest-done burst. Uses the real art from
 * SCENE_ART when present; otherwise a slowly turning ring of polygon shards stands in. The aura is quiet, the bursts
 * are bigger, so celebrations keep their weight.
 */
export function HeroFx({ slot, size }: HeroFxProps) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: slot === 'aura' ? 24000 : 12000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin, slot]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const art = SCENE_ART[slot];
  const isBurst = slot !== 'aura';

  return (
    <View pointerEvents="none" style={{ width: size, height: size }}>
      {art ? (
        <Image source={art} resizeMode="contain" style={{ width: size, height: size }} />
      ) : (
        <Animated.View style={{ width: size, height: size, transform: [{ rotate }] }}>
          <Svg width={size} height={size} viewBox="0 0 100 100">
            <Polygon points="50,14 75,25 86,50 75,75 50,86 25,75 14,50 25,25" fill={PALETTE.sipag300} opacity={isBurst ? 0.45 : 0.28} />
            {RAYS.map((a, i) => (
              <Polygon
                key={a}
                points={ray(a, isBurst ? 24 : 30, isBurst ? (i % 2 ? 44 : 50) : 40, isBurst ? 7 : 4)}
                fill={i % 2 ? PALETTE.sipag400 : PALETTE.sipag500}
                opacity={isBurst ? 0.9 : 0.5}
              />
            ))}
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
