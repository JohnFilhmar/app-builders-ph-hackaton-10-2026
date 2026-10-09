import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { PALETTE } from '@/lib/theme/palette';

const COUNT = 10;

function Shard({ index, progress, radius }: { index: number; progress: SharedValue<number>; radius: number }) {
  const angle = (index / COUNT) * Math.PI * 2;
  const reach = radius * (0.7 + (index % 3) * 0.15);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.15 ? progress.value / 0.15 : 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * reach * progress.value },
      { translateY: Math.sin(angle) * reach * progress.value },
      { rotate: '45deg' },
      { scale: 1 - progress.value * 0.5 },
    ],
  }));
  const size = index % 2 ? 8 : 12;
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, backgroundColor: index % 2 ? PALETTE.sipag300 : PALETTE.sipag500 }, style]} />;
}

/**
 * A short burst of gold shards flying out from the hero's chest. Plays once each time `burstKey` changes; 0 draws
 * nothing. Ten views, one shared value, so it costs next to nothing.
 */
export function HeroBurst({ burstKey, radius }: { burstKey: number; radius: number }) {
  const progress = useSharedValue(1);
  useEffect(() => {
    if (burstKey === 0) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [burstKey, progress]);
  if (burstKey === 0) return null;
  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      {Array.from({ length: COUNT }, (_, i) => (
        <Shard key={i} index={i} progress={progress} radius={radius} />
      ))}
    </View>
  );
}
