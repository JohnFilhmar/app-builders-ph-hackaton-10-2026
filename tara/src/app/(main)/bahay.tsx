import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { AvatarStage } from '@/components/avatar/AvatarStage';
import { LevelBar } from '@/components/tara/LevelBar';
import { QuestCard } from '@/components/tara/QuestCard';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { RULES } from '@/lib/game/constants';
import { newEventId } from '@/lib/game/completeQuest';
import { doneQuestsOn } from '@/lib/quests/todayQuests';
import { useGameStore } from '@/lib/stores/gameStore';

function greeting(hour: number): string {
  if (hour < 12) return "Magandang umaga! What's our plan today?";
  if (hour < 18) return 'Magandang hapon! One more Gawain?';
  if (hour < 22) return 'Magandang gabi! Close the day strong.';
  return 'Pahinga muna? Rest is part of the plan too.';
}

/** Home: the hero, the level bar, Tara's line, and today's quests. */
export default function Bahay() {
  const state = useGameStore((s) => s.state);
  const events = useGameStore((s) => s.events);
  const append = useGameStore((s) => s.append);
  const done = useMemo(() => doneQuestsOn(events, state.todayKey), [events, state.todayKey]);

  // comeback after 3+ days away: +20 once, never a red zero
  useEffect(() => {
    if (state.comebackDue) append({ id: newEventId('evt'), type: 'comeback_awarded', at: Date.now(), payload: { xp: RULES.comebackXp } });
  }, [state.comebackDue, append]);

  const lastComeback = events.at(-1)?.type === 'comeback_awarded';
  const line = lastComeback ? `Welcome back! +${RULES.comebackXp} Sipag. Bagong simula ngayon. (New start today.)` : greeting(new Date().getHours());

  return (
    <TaraScreen>
      <View className="h-80 overflow-hidden rounded-3xl bg-banig-100">
        <AvatarStage className="flex-1" />
        <Text className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-1 text-xs text-tara-500">Tap your hero</Text>
      </View>
      <LevelBar state={state} />
      <TaraBubble text={line} />
      <Text className="text-lg font-extrabold text-tara-900">Ngayong araw (Today)</Text>
      {state.openQuests.map((q) => (
        <QuestCard key={q.quest_id} title={q.title} questType={q.quest_type} minutes={q.planned_minutes} status="open" onPress={() => router.push(`/quest/${q.quest_id}`)} />
      ))}
      {done.map((q) => (
        <QuestCard key={q.quest_id} title={q.title} questType={q.quest_type} minutes={q.minutes} status="done" xp={q.xp} tier={q.tier} />
      ))}
      {state.openQuests.length === 0 && done.length === 0 ? <Text className="text-base text-tara-500">No Gawain yet today.</Text> : null}
      <Button label="+ Magdagdag ng Gawain" onPress={() => router.push('/gawain')} />
    </TaraScreen>
  );
}
