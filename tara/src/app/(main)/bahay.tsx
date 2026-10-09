import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented } from '@/components/Segmented';
import { HeroScene } from '@/components/avatar/HeroScene';
import { QuestCalendar } from '@/components/home/QuestCalendar';
import { QuestDay } from '@/components/home/QuestDay';
import { PixelIcon, type PixelIconName } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { BlockBar } from '@/components/tara/LevelBar';
import { TaraChat } from '@/components/tara/TaraChat';
import { aiReach, useAiStore } from '@/lib/ai/aiSources';
import { RULES } from '@/lib/game/constants';
import { newEventId } from '@/lib/game/completeQuest';
import { useT, type Translate } from '@/lib/i18n/translate';
import { doneQuestsOn } from '@/lib/quests/todayQuests';
import { pickQuote } from '@/lib/quotes';
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
      <Text className="font-num text-2xl text-ink-900">{value}</Text>
      <Text className="text-center text-xs text-tara-700">{label}</Text>
    </View>
  );
}

/** Home: the hero on its scene, level and today's stats, a quote, Tara's chat, and quests by day or by month. */
export default function Bahay() {
  const t = useT();
  const language = useSetupStore((s) => s.language);
  const state = useGameStore((s) => s.state);
  const events = useGameStore((s) => s.events);
  const append = useGameStore((s) => s.append);
  const heroName = useSetupStore((s) => s.heroName);
  const reach = aiReach(useAiStore((s) => s.sources));
  const done = useMemo(() => doneQuestsOn(events, state.todayKey), [events, state.todayKey]);
  const xpToday = done.reduce((sum, q) => sum + q.xp, 0);
  const [view, setView] = useState<'day' | 'calendar'>('day');
  const [day, setDay] = useState(state.todayKey);
  const quote = useMemo(() => pickQuote(Date.now() / 1000), []);
  const scroller = useRef<ScrollView>(null);
  const chat = useRef({ y: 0, h: 0 });
  const sectionY = useRef(0);

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
      <ScrollView ref={scroller} contentContainerClassName="gap-4 pb-24" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center justify-between px-4 pt-2">
          <View>
            <Text className="font-pixel-bold text-5xl leading-tight text-ink-900">TARA</Text>
            <Text className="-mt-1 font-pixel-bold text-base tracking-widest text-sipag-600">LEVEL UP!</Text>
          </View>
          <View className="flex-row gap-2">
            <PolyFrame cut={6} fill={PALETTE.white} stroke={PALETTE.banig300}>
              <View className="min-h-10 flex-row items-center gap-1.5 px-2.5" accessibilityLabel={t(`${streak.current} day streak`, `${streak.current} araw na sunod-sunod`)}>
                <PixelIcon name="flame" size={18} color={streak.current >= 7 ? PALETTE.sipag500 : PALETTE.tara500} />
                <Text className="font-num text-lg text-ink-900">{streak.current}</Text>
              </View>
            </PolyFrame>
            <Pressable accessibilityRole="button" accessibilityLabel={t('AI settings', 'AI settings')} onPress={() => router.push('/ai-settings')}>
              <PolyFrame cut={6} fill={PALETTE.ink900}>
                <View className="min-h-10 flex-row items-center gap-1.5 px-2.5">
                  <PixelIcon name="sparkle" size={16} color={PALETTE.sipag400} />
                  <Text className="font-pixel text-sm text-banig-50">{reach === 'cloud' ? 'Cloud AI' : reach === 'lan' ? 'LAN AI' : 'Offline AI'}</Text>
                  <PixelIcon name="gear" size={16} color={PALETTE.banig50} />
                </View>
              </PolyFrame>
            </Pressable>
          </View>
        </View>

        <View className="gap-0.5 px-4">
          <Text className="text-sm text-tara-700">{now.toLocaleDateString(t('en-PH', 'fil-PH'), { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
          <Text className="font-pixel-bold text-2xl text-ink-900">{greeting(now.getHours(), heroName, t)}</Text>
        </View>

        <HeroScene className="h-80">
          <View className="absolute right-4 top-3 w-36" pointerEvents="none">
            <PolyFrame cut={10} fill="rgba(255,251,242,0.94)" stroke={PALETTE.banig300}>
              <View className="items-center gap-1.5 p-3">
                <Text className="font-pixel-bold text-2xl text-ink-900">
                  Lv. <Text className="font-num">{level.level}</Text>
                </Text>
                <Text className="font-pixel text-sm text-tara-700">{level.name}</Text>
                <BlockBar progress={level.progress} blocks={10} />
                <Text className="font-num text-xs text-tara-700">
                  {state.totalXp}
                  {level.nextXp !== null ? ` / ${level.nextXp}` : ''} Sipag
                </Text>
              </View>
            </PolyFrame>
          </View>
          <Text className="absolute bottom-2 left-4 font-pixel text-xs text-tara-700" pointerEvents="none">
            {t('Tap your hero', 'I-tap ang bida')}
          </Text>
        </HeroScene>

        <View className="gap-4 px-4" onLayout={(e) => (sectionY.current = e.nativeEvent.layout.y)}>
          <PolyFrame cut={12} fill={PALETTE.white} stroke={PALETTE.banig300} strokeWidth={2.5}>
            <View className="flex-row">
              <Stat icon="check" value={String(done.length)} label={t('Quests today', 'Gawain ngayon')} />
              <View className="my-3 w-0.5 bg-banig-300" />
              <Stat icon="star" value={String(xpToday)} label={t('Sipag today', 'Sipag ngayon')} />
              <View className="my-3 w-0.5 bg-banig-300" />
              <Stat icon="flame" value={`${streak.multiplier}x`} label={t('Streak bonus', 'Bonus ng streak')} />
            </View>
          </PolyFrame>

          {quote ? (
            <PolyFrame cut={10} fill={PALETTE.ink900}>
              <View className="flex-row items-start gap-3 p-3.5">
                <PixelIcon name="star" size={20} color={PALETTE.sipag400} />
                <Text className="flex-1 text-base italic leading-6 text-banig-50">{language === 'tl' ? quote.tl : quote.en}</Text>
              </View>
            </PolyFrame>
          ) : null}

          <View onLayout={(e) => (chat.current = { y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })}>
            <TaraChat
              greeting={line}
              // the keyboard covers the lower half: scroll so the chat's input row sits about 300 dp from the top, above it
              onFocusInput={() => setTimeout(() => scroller.current?.scrollTo({ y: Math.max(0, sectionY.current + chat.current.y + chat.current.h - 300), animated: true }), 250)}
            />
          </View>

          <View className="gap-3 pt-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-pixel-bold text-xl text-ink-900">{t('Quests', 'Mga Gawain')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('Add a quest', 'Magdagdag ng Gawain')} onPress={() => router.push('/gawain')} className="h-11 flex-row items-center gap-1.5 px-2">
                <PixelIcon name="plus" size={16} color={PALETTE.ink900} />
                <Text className="font-pixel text-base text-ink-900">{t('Add', 'Dagdag')}</Text>
              </Pressable>
            </View>
            <Segmented
              options={[
                { value: 'day', label: t('By day', 'Kada araw'), icon: 'scroll' },
                { value: 'calendar', label: t('Calendar', 'Kalendaryo'), icon: 'clock' },
              ]}
              value={view}
              onChange={setView}
            />
            {view === 'day' ? (
              <QuestDay day={day} onChangeDay={setDay} />
            ) : (
              <QuestCalendar
                selected={day}
                onPick={(key) => {
                  setDay(key);
                  setView('day');
                }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
