import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarStage } from '@/components/avatar/AvatarStage';
import { PixelIcon, type PixelIconName } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { SceneBackdrop } from '@/components/scene/SceneBackdrop';
import { BlockBar } from '@/components/tara/LevelBar';
import { QuestCard } from '@/components/tara/QuestCard';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { RULES } from '@/lib/game/constants';
import { newEventId } from '@/lib/game/completeQuest';
import { useT, type Translate } from '@/lib/i18n/translate';
import { doneQuestsOn } from '@/lib/quests/todayQuests';
import { useGameStore } from '@/lib/stores/gameStore';
import { useSetupStore } from '@/lib/stores/setupStore';
import { PALETTE } from '@/lib/theme/palette';

function greeting(hour: number, name: string, t: Translate): string {
  const who = name ? `, ${name}` : '';
  if (hour < 12) return t(`Good morning${who}!`, `Magandang umaga${who}!`);
  if (hour < 18) return t(`Good afternoon${who}!`, `Magandang hapon${who}!`);
  return t(`Good evening${who}!`, `Magandang gabi${who}!`);
}

function Stat({ icon, value, label }: { icon: PixelIconName; value: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-1 py-3">
      <PixelIcon name={icon} size={20} color={PALETTE.sipag600} />
      <Text className="font-pixel-bold text-2xl text-ink-900">{value}</Text>
      <Text className="text-center text-xs text-tara-700">{label}</Text>
    </View>
  );
}

/** Home: the hero on its scene, level and today's stats, Tara's line, and today's quests. */
export default function Bahay() {
  const t = useT();
  const state = useGameStore((s) => s.state);
  const events = useGameStore((s) => s.events);
  const append = useGameStore((s) => s.append);
  const heroName = useSetupStore((s) => s.heroName);
  const done = useMemo(() => doneQuestsOn(events, state.todayKey), [events, state.todayKey]);
  const xpToday = done.reduce((sum, q) => sum + q.xp, 0);

  // comeback after 3+ days away: +20 once, never a red zero
  useEffect(() => {
    if (state.comebackDue) append({ id: newEventId('evt'), type: 'comeback_awarded', at: Date.now(), payload: { xp: RULES.comebackXp } });
  }, [state.comebackDue, append]);

  const now = new Date();
  const lastComeback = events.at(-1)?.type === 'comeback_awarded';
  const line = lastComeback
    ? t(`Welcome back! +${RULES.comebackXp} Sipag. A fresh start today.`, `Welcome back! +${RULES.comebackXp} Sipag. Bagong simula ngayon.`)
    : done.length > 0
      ? t('Every small step counts. One more?', 'Bawat maliit na hakbang ay mahalaga. Isa pa?')
      : t("Pick one quest and I'll check it with you.", 'Pumili ng isang Gawain, sasamahan kita.');
  const { level, streak } = state;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-banig-50">
      <ScrollView contentContainerClassName="gap-4 pb-24">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <View>
            <Text className="font-pixel-bold text-3xl leading-8 text-ink-900">TARA</Text>
            <Text className="font-pixel text-xs tracking-widest text-sipag-600">LEVEL UP!</Text>
          </View>
          <View className="flex-row gap-2">
            <PolyFrame cut={6} fill={PALETTE.white} stroke={PALETTE.banig300}>
              <View className="flex-row items-center gap-1.5 px-2.5 py-1.5" accessibilityLabel={t(`${streak.current} day streak`, `${streak.current} araw na sunod-sunod`)}>
                <PixelIcon name="flame" size={16} color={streak.current >= 7 ? PALETTE.sipag500 : PALETTE.tara500} />
                <Text className="font-pixel-bold text-base text-ink-900">{streak.current}</Text>
              </View>
            </PolyFrame>
            <PolyFrame cut={6} fill={PALETTE.ink900}>
              <View className="flex-row items-center gap-1.5 px-2.5 py-1.5">
                <PixelIcon name="sparkle" size={16} color={PALETTE.sipag400} />
                <Text className="font-pixel text-sm text-banig-50">Offline AI</Text>
              </View>
            </PolyFrame>
          </View>
        </View>

        <View className="gap-0.5 px-4">
          <Text className="text-sm text-tara-700">{now.toLocaleDateString(t('en-PH', 'fil-PH'), { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
          <Text className="font-pixel-bold text-2xl text-ink-900">{greeting(now.getHours(), heroName, t)}</Text>
        </View>

        <View className="h-80">
          <SceneBackdrop slot="home_backdrop" />
          <AvatarStage className="flex-1" fx="aura" />
          <View className="absolute right-4 top-3 w-36" pointerEvents="none">
            <PolyFrame cut={10} fill="rgba(255,251,242,0.94)" stroke={PALETTE.banig300}>
              <View className="items-center gap-1.5 p-3">
                <Text className="font-pixel-bold text-2xl text-ink-900">Lv. {level.level}</Text>
                <Text className="font-pixel text-sm text-tara-700">{level.name}</Text>
                <BlockBar progress={level.progress} blocks={10} />
                <Text className="font-pixel text-xs text-tara-700">
                  {state.totalXp}
                  {level.nextXp !== null ? ` / ${level.nextXp}` : ''} Sipag
                </Text>
              </View>
            </PolyFrame>
          </View>
          <Text className="absolute bottom-2 left-4 font-pixel text-xs text-tara-700" pointerEvents="none">
            {t('Tap your hero', 'I-tap ang bida')}
          </Text>
        </View>

        <View className="gap-4 px-4">
          <PolyFrame cut={12} fill={PALETTE.white} stroke={PALETTE.banig300}>
            <View className="flex-row">
              <Stat icon="check" value={String(done.length)} label={t('Quests today', 'Gawain ngayon')} />
              <View className="my-3 w-px bg-banig-200" />
              <Stat icon="star" value={String(xpToday)} label={t('Sipag today', 'Sipag ngayon')} />
              <View className="my-3 w-px bg-banig-200" />
              <Stat icon="flame" value={`${streak.multiplier}x`} label={t('Streak bonus', 'Bonus ng streak')} />
            </View>
          </PolyFrame>

          <TaraBubble text={line} />

          <View className="flex-row items-center justify-between pt-2">
            <Text className="font-pixel-bold text-xl text-ink-900">{t("Today's quests", 'Gawain ngayong araw')}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Add a quest', 'Magdagdag ng Gawain')}
              onPress={() => router.push('/gawain')}
              className="h-11 flex-row items-center gap-1.5 px-2"
            >
              <PixelIcon name="plus" size={16} color={PALETTE.ink900} />
              <Text className="font-pixel text-base text-ink-900">{t('Add', 'Dagdag')}</Text>
            </Pressable>
          </View>
          {state.openQuests.map((q) => (
            <QuestCard key={q.quest_id} title={q.title} questType={q.quest_type} minutes={q.planned_minutes} status="open" onPress={() => router.push(`/quest/${q.quest_id}`)} />
          ))}
          {done.map((q) => (
            <QuestCard key={q.quest_id} title={q.title} questType={q.quest_type} minutes={q.minutes} status="done" xp={q.xp} tier={q.tier} />
          ))}
          {state.openQuests.length === 0 && done.length === 0 ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/gawain')}>
              <PolyFrame cut={12} fill={PALETTE.banig100} stroke={PALETTE.banig300}>
                <View className="items-center gap-2 p-6">
                  <PixelIcon name="scroll" size={32} color={PALETTE.tara500} />
                  <Text className="font-pixel-bold text-lg text-ink-900">{t('No quests yet today', 'Wala pang Gawain ngayon')}</Text>
                  <Text className="text-center text-sm text-tara-700">
                    {t('Add your first one. Even "make the bed" counts.', 'Magdagdag ng una. Kahit "ayusin ang kama" ay pwede.')}
                  </Text>
                </View>
              </PolyFrame>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
