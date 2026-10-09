import { useEffect, useRef } from 'react';
import { Animated, Modal, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useGameStore } from '@/lib/stores/gameStore';

const UNLOCKS: Record<number, string[]> = {
  2: ['Tier 2 outfit pieces', 'Companion: Bugoy the carabao calf', 'Aura: Alitaptap (fireflies)', 'Ehersisyo with Bilang Mode', 'Pabuya list'],
  3: ['Tier 3 outfit pieces', 'Companion: Haribon the eagle chick', 'Aura: Bahaghari (rainbow)', 'Baon Days streak savers'],
};

/** Plays once per new level: a banig banner with the level name and what just unlocked. */
export function LevelUpOverlay() {
  const level = useGameStore((s) => s.state.level);
  const seenLevel = useGameStore((s) => s.seenLevel);
  const markLevelSeen = useGameStore((s) => s.markLevelSeen);
  const unroll = useRef(new Animated.Value(0)).current;
  const isVisible = level.level > seenLevel;

  useEffect(() => {
    if (!isVisible) return;
    unroll.setValue(0);
    Animated.spring(unroll, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  }, [isVisible, unroll]);

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={() => markLevelSeen(level.level)}>
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        <Animated.View style={{ transform: [{ scaleY: unroll }] }} className="w-full gap-4 rounded-3xl border-4 border-sipag-500 bg-banig-100 p-6">
          <Text className="text-center text-sm font-bold uppercase text-tara-500">Level up!</Text>
          <Text className="text-center text-4xl font-extrabold text-tara-900">
            Level {level.level} · {level.name}
          </Text>
          <View className="gap-1.5">
            {(UNLOCKS[level.level] ?? []).map((u) => (
              <Text key={u} className="text-base text-tara-700">
                ✓ {u}
              </Text>
            ))}
          </View>
          <Button label="Tara na!" onPress={() => markLevelSeen(level.level)} />
        </Animated.View>
      </View>
    </Modal>
  );
}
