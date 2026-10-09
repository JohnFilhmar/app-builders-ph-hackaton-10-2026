import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { AvatarStage } from '@/components/avatar/AvatarStage';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { useSetupStore } from '@/lib/stores/setupStore';
import type { BaseAvatar } from '@/types/gameEvents';

const CHOICES: { value: BaseAvatar; label: string }[] = [
  { value: 'male', label: 'Lalaki' },
  { value: 'female', label: 'Babae' },
];

/** First launch, step 1: meet Tara and pick a hero. */
export default function SetupWelcome() {
  const baseAvatar = useSetupStore((s) => s.baseAvatar);
  const setBaseAvatar = useSetupStore((s) => s.setBaseAvatar);
  return (
    <TaraScreen title="Tara LEVEL UP!" subtitle="Gawing laro ang araw mo. (Turn your day into a game.)" scroll={false}>
      <TaraBubble text="Kumusta! Ako si Tara. I check that your tasks really happened, and you level up. Who's your hero?" />
      <AvatarStage className="flex-1" />
      <View className="flex-row gap-3">
        {CHOICES.map((c) => (
          <Pressable
            key={c.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: baseAvatar === c.value }}
            onPress={() => setBaseAvatar(c.value)}
            className={`flex-1 items-center rounded-2xl border-2 py-4 ${baseAvatar === c.value ? 'border-sipag-500 bg-sipag-300' : 'border-banig-300 bg-white'}`}
          >
            <Text className="text-lg font-bold text-tara-900">{c.label}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="Next: ihanda si Tara" onPress={() => router.push('/setup/models')} />
    </TaraScreen>
  );
}
