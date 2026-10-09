import { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { setNanayMode } from '@/lib/alerts/reminders';
import { newEventId } from '@/lib/game/completeQuest';
import { buildDemoEvents } from '@/lib/game/demoSeed';
import { useGameStore } from '@/lib/stores/gameStore';
import { useSetupStore } from '@/lib/stores/setupStore';
import type { AchievementId } from '@/types/gameEvents';

const ACHIEVEMENTS: { id: AchievementId; name: string; how: string; isHidden?: boolean }[] = [
  { id: 'unang_hakbang', name: 'Unang Hakbang', how: 'Finish your first Gawain' },
  { id: 'unang_patunay', name: 'Unang Patunay', how: 'Finish a Gawain with Patunay (proof)' },
  { id: 'malinis_na_kwarto', name: 'Malinis na Kwarto', how: '10 Linis quests at Patunay' },
  { id: 'tatlong_araw', name: 'Tatlong Araw', how: '3-day streak' },
  { id: 'isang_linggo', name: 'Isang Linggo', how: '7-day streak' },
  { id: 'perpekto', name: 'Perpekto', how: 'Every question right on an Aral quiz' },
  { id: 'basa_bida', name: 'Basa Bida', how: '30 minutes of reading aloud' },
  { id: 'pabuya_natanggap', name: 'Pabuya Natanggap', how: 'Claim your first Pabuya' },
  { id: 'walang_signal', name: 'Walang Signal, Walang Problema', how: 'Patunay in airplane mode', isHidden: true },
];

/** Real rewards bought with Sipag, the badges earned, and settings. */
export default function Pabuya() {
  const state = useGameStore((s) => s.state);
  const append = useGameStore((s) => s.append);
  const replaceAll = useGameStore((s) => s.replaceAll);
  const isNanay = useSetupStore((s) => s.isNanayMode);
  const setIsNanay = useSetupStore((s) => s.setNanayMode);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const isUnlocked = state.level.level >= 2;

  const add = () => {
    const value = Number(price);
    if (!title.trim() || !Number.isInteger(value) || value <= 0) return;
    append({ id: newEventId('evt'), type: 'pabuya_created', at: Date.now(), payload: { pabuya_id: newEventId('pabuya'), title: title.trim(), price: value } });
    setTitle('');
    setPrice('');
  };

  const claim = (id: string, itemTitle: string) =>
    Alert.alert(`Kunin na ang ${itemTitle}?`, 'This spends Sipag from your Pabuya balance. Your level stays.', [
      { text: 'Hindi pa', style: 'cancel' },
      { text: 'Kunin!', onPress: () => append({ id: newEventId('evt'), type: 'pabuya_claimed', at: Date.now(), payload: { pabuya_id: id } }) },
    ]);

  const loadDemo = () =>
    Alert.alert('Load demo state?', 'Replaces this phone\'s progress with the stage demo (370 Sipag, level 2).', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Load', style: 'destructive', onPress: () => replaceAll(buildDemoEvents(Date.now())) },
    ]);

  return (
    <TaraScreen title="Pabuya" subtitle="Totoong gantimpala. (Real rewards.)">
      <Card title={`Balance: ${state.pabuyaBalance} Sipag`}>
        {!isUnlocked ? (
          <Text className="text-base text-tara-700">The Pabuya list opens at Level 2 (Masigla). Malapit na!</Text>
        ) : (
          <>
            {state.pabuya.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between rounded-2xl bg-banig-50 p-3">
                <View>
                  <Text className="text-base font-bold text-tara-900">{item.title}</Text>
                  <Text className="text-sm text-tara-500">{item.price} Sipag</Text>
                </View>
                {item.claimed ? (
                  <Text className="text-sm font-bold text-leaf-700">Natanggap ✓</Text>
                ) : state.pabuyaBalance >= item.price ? (
                  <Pressable accessibilityRole="button" onPress={() => claim(item.id, item.title)} className="rounded-full bg-sipag-400 px-4 py-2">
                    <Text className="font-bold text-tara-900">Kaya na! Kunin</Text>
                  </Pressable>
                ) : (
                  <Text className="text-sm text-tara-500">{Math.round((state.pabuyaBalance / item.price) * 100)}%</Text>
                )}
              </View>
            ))}
            <Field label="Bagong Pabuya" value={title} onChangeText={setTitle} placeholder="Milk tea" />
            <Field label="Presyo (Sipag)" value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="500" />
            <Button label="Idagdag ang Pabuya" variant="secondary" onPress={add} disabled={!title.trim() || !price} />
          </>
        )}
      </Card>

      <Card title="Mga Badge (Achievements)">
        {ACHIEVEMENTS.map((a) => {
          const isEarned = state.achievements.includes(a.id);
          return (
            <View key={a.id} className={`rounded-2xl p-3 ${isEarned ? 'bg-sipag-300' : 'bg-banig-50'}`}>
              <Text className="text-base font-bold text-tara-900">{a.isHidden && !isEarned ? '???' : `${isEarned ? '✓ ' : ''}${a.name}`}</Text>
              <Text className="text-sm text-tara-500">{a.isHidden && !isEarned ? 'Hidden' : a.how}</Text>
            </View>
          );
        })}
      </Card>

      <Card title="Settings">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-base font-bold text-tara-900">Nanay Mode</Text>
            <Text className="text-sm text-tara-500">Daily reminders at 6:30 and 19:00, even with the app closed.</Text>
          </View>
          <Switch
            value={isNanay}
            onValueChange={(on) => {
              void setNanayMode(on).then(setIsNanay);
            }}
          />
        </View>
        <Pressable onLongPress={loadDemo} delayLongPress={1200}>
          <Text className="text-xs text-tara-300">Tara 0.1.0 · offline · nothing leaves this phone</Text>
        </Pressable>
      </Card>
    </TaraScreen>
  );
}
