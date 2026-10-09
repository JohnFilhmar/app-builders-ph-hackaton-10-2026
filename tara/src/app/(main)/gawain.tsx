import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { SchedulePicker } from '@/components/quest/SchedulePicker';
import { QuestCard } from '@/components/tara/QuestCard';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { QUEST_TYPES } from '@/lib/game/constants';
import { useT } from '@/lib/i18n/translate';
import { declareQuest } from '@/lib/quests/declareQuest';
import { PROOF_ICON, proofHint, QUEST_ICON, questName } from '@/lib/quests/questLook';
import { classifyQuest, QUEST_INFO } from '@/lib/quests/questTypes';
import { usualTime } from '@/lib/quests/schedule';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';
import type { QuestType } from '@/types/gameEvents';

const MINUTE_CHOICES = [5, 15, 30, 60];

/** Plan a Gawain: Tara suggests a type and duration as you type; the user decides everything. */
export default function Gawain() {
  const t = useT();
  const state = useGameStore((s) => s.state);
  const append = useGameStore((s) => s.append);
  const [title, setTitle] = useState('');
  const [questType, setQuestType] = useState<QuestType>('sariling');
  const [minutes, setMinutes] = useState(QUEST_INFO.sariling.defaultMinutes);
  const [isTouched, setIsTouched] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<number | undefined>();
  const events = useGameStore((s) => s.events);

  // Ehersisyo unlocks at level 2; locked systems stay hidden until then
  const types = QUEST_TYPES.filter((type) => type !== 'ehersisyo' || state.level.level >= 2);

  const onTitle = (text: string) => {
    setTitle(text);
    if (isTouched) return;
    const suggestion = classifyQuest(text);
    if (types.includes(suggestion.type)) setQuestType(suggestion.type);
    setMinutes(suggestion.minutes);
  };

  const declare = (startNow: boolean) => {
    const questId = declareQuest(append, { title, quest_type: questType, planned_minutes: minutes, scheduled_at: startNow ? undefined : scheduledAt });
    setTitle('');
    setScheduledAt(undefined);
    setIsTouched(false);
    if (startNow) router.push(`/quest/${questId}`);
    else router.push('/bahay');
  };

  return (
    <TaraScreen title={t('New quest', 'Bagong Gawain')} subtitle={t('You decide what counts. Tara checks the proof.', 'Ikaw ang bahala kung ano ang mahalaga. Si Tara ang titingin sa patunay.')}>
      <Field label={t('What will you do?', 'Anong gagawin mo?')} value={title} onChangeText={onTitle} placeholder={t('Clean my room, 30 mins', 'Linis ng kwarto, 30 mins')} />

      <View className="gap-2">
        <Text className="font-pixel text-sm text-tara-700">{t('Quest type', 'Uri ng Gawain')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {types.map((type) => {
            const isPicked = type === questType;
            return (
              <Pressable
                key={type}
                accessibilityRole="radio"
                accessibilityState={{ checked: isPicked }}
                onPress={() => {
                  setIsTouched(true);
                  setQuestType(type);
                }}
                className="w-[48.5%]"
              >
                <PolyFrame cut={10} fill={isPicked ? PALETTE.sipag400 : PALETTE.white} stroke={isPicked ? PALETTE.sipag600 : PALETTE.banig300}>
                  <View className="min-h-16 flex-row items-center gap-2.5 px-3 py-3">
                    <PixelIcon name={QUEST_ICON[type]} size={24} color={isPicked ? PALETTE.ink900 : PALETTE.tara500} />
                    <Text className="flex-1 font-pixel text-base text-ink-900" numberOfLines={2}>
                      {questName(type, t)}
                    </Text>
                  </View>
                </PolyFrame>
              </Pressable>
            );
          })}
        </View>
        <PolyFrame cut={8} fill={PALETTE.ink900}>
          <View className="flex-row items-center gap-2 px-3.5 py-2.5">
            <PixelIcon name={PROOF_ICON[questType]} size={16} color={PALETTE.sipag400} />
            <Text className="flex-1 text-sm text-banig-50">{proofHint(questType, t)}</Text>
          </View>
        </PolyFrame>
      </View>

      <View className="gap-2">
        <Text className="font-pixel text-sm text-tara-700">{t('How long?', 'Gaano katagal?')}</Text>
        <View className="flex-row gap-2">
          {MINUTE_CHOICES.map((m) => (
            <Pressable key={m} accessibilityRole="radio" accessibilityState={{ checked: minutes === m }} onPress={() => setMinutes(m)} className="flex-1">
              <PolyFrame cut={7} fill={minutes === m ? PALETTE.sipag400 : PALETTE.white} stroke={minutes === m ? PALETTE.sipag600 : PALETTE.banig300}>
                <Text className="py-3 text-center font-num text-base text-ink-900">{m} min</Text>
              </PolyFrame>
            </Pressable>
          ))}
        </View>
        {!MINUTE_CHOICES.includes(minutes) ? <Text className="text-sm text-tara-700">{t(`From your title: ${minutes} min`, `Mula sa pamagat: ${minutes} min`)}</Text> : null}
      </View>

      <View className="gap-2">
        <Text className="font-pixel text-sm text-tara-700">{t('When? (Tara reminds you)', 'Kailan? (Ipapaalala ni Tara)')}</Text>
        <SchedulePicker value={scheduledAt} onChange={setScheduledAt} usual={usualTime(events, questType)} />
      </View>

      <View className="gap-3 pt-2">
        <Button label={t('Start now', 'Simulan na')} onPress={() => declare(true)} disabled={!title.trim()} />
        <Button label={scheduledAt ? t('Schedule it', 'I-schedule') : t('Add for later', 'Idagdag para mamaya')} variant="secondary" icon="plus" onPress={() => declare(false)} disabled={!title.trim()} />
      </View>

      {state.openQuests.length > 0 ? <Text className="pt-4 font-pixel-bold text-xl text-ink-900">{t('Planned', 'Naka-plano')}</Text> : null}
      {state.openQuests.map((q) => (
        <QuestCard key={q.quest_id} title={q.title} questType={q.quest_type} minutes={q.planned_minutes} scheduledAt={q.scheduled_at} status="open" onPress={() => router.push(`/quest/${q.quest_id}`)} />
      ))}
    </TaraScreen>
  );
}
