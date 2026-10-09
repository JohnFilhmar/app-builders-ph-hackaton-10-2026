import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { QuestCard } from '@/components/tara/QuestCard';
import { addDays } from '@/lib/game/days';
import { useT, type Translate } from '@/lib/i18n/translate';
import { openQuestsOn } from '@/lib/quests/questsByDay';
import { doneQuestsOn } from '@/lib/quests/todayQuests';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';

const PAGE = 4;

/** "Today", "Yesterday", "Tomorrow" or a short date for a day key. */
function dayLabel(key: string, todayKey: string, t: Translate): string {
  if (key === todayKey) return t('Today', 'Ngayon');
  if (key === addDays(todayKey, -1)) return t('Yesterday', 'Kahapon');
  if (key === addDays(todayKey, 1)) return t('Tomorrow', 'Bukas');
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(t('en-PH', 'fil-PH'), { weekday: 'short', month: 'short', day: 'numeric' });
}

function NavButton({ icon, label, disabled, onPress }: { icon: 'back' | 'arrow'; label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={{ opacity: disabled ? 0.35 : 1 }}>
      <PolyFrame cut={7} fill={PALETTE.white} stroke={PALETTE.banig300}>
        <View className="h-11 w-11 items-center justify-center">
          <PixelIcon name={icon} size={18} color={PALETTE.ink900} />
        </View>
      </PolyFrame>
    </Pressable>
  );
}

type QuestDayProps = { day: string; onChangeDay: (key: string) => void };

/** Quests for one day, open first then done, with day arrows and pages of four so the list never runs long. */
export function QuestDay({ day, onChangeDay }: QuestDayProps) {
  const t = useT();
  const events = useGameStore((s) => s.events);
  const openQuests = useGameStore((s) => s.state.openQuests);
  const todayKey = useGameStore((s) => s.state.todayKey);
  const [page, setPage] = useState(0);
  const open = useMemo(() => openQuestsOn(openQuests, day, todayKey), [openQuests, day, todayKey]);
  const done = useMemo(() => doneQuestsOn(events, day), [events, day]);
  const total = open.length + done.length;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const current = Math.min(page, pages - 1);
  const from = current * PAGE;
  const shownOpen = open.slice(from, from + PAGE);
  const shownDone = done.slice(Math.max(0, from - open.length), from + PAGE - open.length);

  const goDay = (delta: number) => {
    setPage(0);
    onChangeDay(addDays(day, delta));
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <NavButton icon="back" label={t('Previous day', 'Nakaraang araw')} onPress={() => goDay(-1)} />
        <Pressable accessibilityRole="button" onPress={() => onChangeDay(todayKey)} className="flex-1 items-center">
          <Text className="font-pixel-bold text-lg text-ink-900">{dayLabel(day, todayKey, t)}</Text>
          {day !== todayKey ? <Text className="font-pixel text-xs text-sipag-600">{t('Tap for today', 'I-tap para ngayon')}</Text> : null}
        </Pressable>
        <NavButton icon="arrow" label={t('Next day', 'Susunod na araw')} onPress={() => goDay(1)} />
      </View>

      {shownOpen.map((q) => (
        <QuestCard key={q.quest_id} title={q.title} questType={q.quest_type} minutes={q.planned_minutes} scheduledAt={q.scheduled_at} status="open" onPress={() => router.push(`/quest/${q.quest_id}`)} />
      ))}
      {shownDone.map((q) => (
        <QuestCard key={q.quest_id} title={q.title} questType={q.quest_type} minutes={q.minutes} status="done" xp={q.xp} tier={q.tier} />
      ))}
      {total === 0 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/gawain')}>
          <PolyFrame cut={12} fill={PALETTE.banig100} stroke={PALETTE.banig300}>
            <View className="items-center gap-2 p-6">
              <PixelIcon name="scroll" size={32} color={PALETTE.tara500} />
              <Text className="font-pixel-bold text-lg text-ink-900">{t('No quests on this day', 'Walang Gawain sa araw na ito')}</Text>
              <Text className="text-center text-sm text-tara-700">{t('Tap to plan one, or tell Tara above.', 'I-tap para magplano, o sabihin kay Tara sa itaas.')}</Text>
            </View>
          </PolyFrame>
        </Pressable>
      ) : null}

      {pages > 1 ? (
        <View className="flex-row items-center justify-between">
          <NavButton icon="back" label={t('Previous page', 'Nakaraang pahina')} disabled={current === 0} onPress={() => setPage(current - 1)} />
          <Text className="font-num text-base text-tara-700">
            {current + 1} / {pages}
          </Text>
          <NavButton icon="arrow" label={t('Next page', 'Susunod na pahina')} disabled={current >= pages - 1} onPress={() => setPage(current + 1)} />
        </View>
      ) : null}
    </View>
  );
}
