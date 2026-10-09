import { useEffect, useRef } from 'react';
import { Animated, Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { AvatarStage } from '@/components/avatar/AvatarStage';
import { PixelIcon } from '@/components/poly/PixelIcon';
import { useT, type Translate } from '@/lib/i18n/translate';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';

// only what the build really gates by level, so the banner never promises a feature that is not there
const unlocksFor = (level: number, t: Translate): string[] =>
  ({
    2: [t('Exercise quests: count your reps aloud', 'Ehersisyo: bilangin ang reps nang malakas'), t('Rewards: set your own treats', 'Pabuya: sariling premyo')],
    3: [t('Baon Days: streak savers', 'Baon Days: pang-ligtas ng streak')],
  })[level] ?? [];

/** Plays once per new level: a dark stage, the hero jumping on the level-up burst, and what just unlocked. */
export function LevelUpOverlay() {
  const t = useT();
  const level = useGameStore((s) => s.state.level);
  const seenLevel = useGameStore((s) => s.seenLevel);
  const markLevelSeen = useGameStore((s) => s.markLevelSeen);
  const rise = useRef(new Animated.Value(0)).current;
  const isVisible = level.level > seenLevel;

  useEffect(() => {
    if (!isVisible) return;
    rise.setValue(0);
    Animated.spring(rise, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }).start();
  }, [isVisible, rise]);

  return (
    <Modal visible={isVisible} animationType="fade" statusBarTranslucent onRequestClose={() => markLevelSeen(level.level)}>
      <SafeAreaView className="flex-1 bg-ink-900">
        <View className="flex-1 justify-between gap-4 p-5">
          <Animated.View style={{ opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }} className="items-center gap-1 pt-6">
            <Text className="font-pixel-bold text-5xl text-sipag-400">LEVEL UP!</Text>
            <Text className="font-pixel-bold text-2xl text-banig-50">Lv. {level.level}</Text>
            <Text className="font-pixel text-lg text-sipag-300">{level.name}</Text>
          </Animated.View>
          <AvatarStage className="flex-1" fx="level_up_fx" celebrate evolveFrom={seenLevel} />
          <View className="gap-2.5">
            {unlocksFor(level.level, t).map((u) => (
              <View key={u} className="flex-row items-center gap-2.5">
                <PixelIcon name="star" size={18} color={PALETTE.sipag400} />
                <Text className="flex-1 text-base text-banig-50">{u}</Text>
              </View>
            ))}
          </View>
          <Button label={t('Awesome!', 'Ang galing!')} variant="gold" onPress={() => markLevelSeen(level.level)} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
