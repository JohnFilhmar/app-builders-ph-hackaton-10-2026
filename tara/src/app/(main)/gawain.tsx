import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Segmented } from '@/components/Segmented';
import { QuestCard } from '@/components/tara/QuestCard';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { newEventId } from '@/lib/game/completeQuest';
import { QUEST_TYPES } from '@/lib/game/constants';
import { classifyQuest, QUEST_INFO } from '@/lib/quests/questTypes';
import { useGameStore } from '@/lib/stores/gameStore';
import type { QuestType } from '@/types/gameEvents';

/** Plan a Gawain: Tara suggests a type and duration instantly; the user decides everything. */
export default function Gawain() {
  const state = useGameStore((s) => s.state);
  const append = useGameStore((s) => s.append);
  const [title, setTitle] = useState('');
  const [questType, setQuestType] = useState<QuestType>('sariling');
  const [minutes, setMinutes] = useState(QUEST_INFO.sariling.defaultMinutes);
  const [isTouched, setIsTouched] = useState(false);

  // Ehersisyo unlocks at level 2; locked systems stay hidden until then
  const types = QUEST_TYPES.filter((t) => t !== 'ehersisyo' || state.level.level >= 2);
  const options = types.map((t) => ({ value: t, label: QUEST_INFO[t].label }));

  const onTitle = (text: string) => {
    setTitle(text);
    if (isTouched) return;
    const suggestion = classifyQuest(text);
    if (types.includes(suggestion.type)) setQuestType(suggestion.type);
    setMinutes(suggestion.minutes);
  };

  const declare = (startNow: boolean) => {
    const questId = newEventId('q');
    append({ id: newEventId('evt'), type: 'quest_declared', at: Date.now(), payload: { quest_id: questId, title: title.trim(), quest_type: questType, planned_minutes: minutes } });
    setTitle('');
    setIsTouched(false);
    if (startNow) router.push(`/quest/${questId}`);
    else router.push('/bahay');
  };

  return (
    <TaraScreen title="Gawain" subtitle="Ikaw ang bahala kung ano ang mahalaga. (You decide what counts.)">
      <Card>
        <Field label="Anong Gawain? (What task?)" value={title} onChangeText={onTitle} placeholder="Linis ng kwarto, 30 mins" />
        <TaraBubble text={`Suggestion: ${QUEST_INFO[questType].label} (${QUEST_INFO[questType].english}), ${minutes} min. Proof: ${QUEST_INFO[questType].proofHint}.`} />
        <Segmented
          options={options}
          value={questType}
          onChange={(t) => {
            setIsTouched(true);
            setQuestType(t);
          }}
        />
        <View className="flex-row items-center justify-center gap-6">
          <Pressable accessibilityRole="button" accessibilityLabel="Less time" onPress={() => setMinutes((m) => Math.max(5, m - 5))} className="h-12 w-12 items-center justify-center rounded-full bg-banig-200">
            <Text className="text-2xl font-bold text-tara-900">−</Text>
          </Pressable>
          <Text className="text-2xl font-extrabold text-tara-900">{minutes} minuto</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="More time" onPress={() => setMinutes((m) => Math.min(120, m + 5))} className="h-12 w-12 items-center justify-center rounded-full bg-banig-200">
            <Text className="text-2xl font-bold text-tara-900">+</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button label="Idagdag" variant="secondary" onPress={() => declare(false)} disabled={!title.trim()} />
          </View>
          <View className="flex-1">
            <Button label="Simulan na" onPress={() => declare(true)} disabled={!title.trim()} />
          </View>
        </View>
      </Card>
      {state.openQuests.length > 0 ? <Text className="text-lg font-extrabold text-tara-900">Naka-plano (Planned)</Text> : null}
      {state.openQuests.map((q) => (
        <QuestCard key={q.quest_id} title={q.title} questType={q.quest_type} minutes={q.planned_minutes} status="open" onPress={() => router.push(`/quest/${q.quest_id}`)} />
      ))}
    </TaraScreen>
  );
}
