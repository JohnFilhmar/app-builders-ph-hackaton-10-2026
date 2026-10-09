import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { dayKey } from '@/lib/game/days';
import { useT } from '@/lib/i18n/translate';
import { questCountsByDay } from '@/lib/quests/questsByDay';
import { useGameStore } from '@/lib/stores/gameStore';
import { PALETTE } from '@/lib/theme/palette';

type QuestCalendarProps = { selected: string; onPick: (key: string) => void };

/**
 * Month view of activity: green blocks for finished quests, gold for planned ones. Tapping a day opens its list.
 * Days are keyed at local noon so a timezone edge never shifts a cell.
 */
export function QuestCalendar({ selected, onPick }: QuestCalendarProps) {
  const t = useT();
  const events = useGameStore((s) => s.events);
  const openQuests = useGameStore((s) => s.state.openQuests);
  const todayKey = useGameStore((s) => s.state.todayKey);
  const [y0 = 2026, m0 = 1] = selected.split('-').map(Number);
  const [month, setMonth] = useState({ year: y0, month: m0 - 1 });
  const counts = useMemo(() => questCountsByDay(events, openQuests), [events, openQuests]);

  const first = new Date(month.year, month.month, 1, 12);
  const daysIn = new Date(month.year, month.month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array<null>(first.getDay()).fill(null), ...Array.from({ length: daysIn }, (_, i) => dayKey(new Date(month.year, month.month, i + 1, 12).getTime()))];
  while (cells.length % 7) cells.push(null);
  const shift = (delta: number) => setMonth(({ year, month: m }) => ({ year: m + delta < 0 ? year - 1 : m + delta > 11 ? year + 1 : year, month: (m + delta + 12) % 12 }));
  const weekdays = t('S M T W T F S', 'L L M M H B S').split(' ');

  return (
    <PolyFrame cut={12} fill={PALETTE.white} stroke={PALETTE.banig300} strokeWidth={2.5}>
      <View className="gap-2 p-3">
        <View className="flex-row items-center justify-between">
          <Pressable accessibilityRole="button" accessibilityLabel={t('Previous month', 'Nakaraang buwan')} onPress={() => shift(-1)} className="h-11 w-11 items-center justify-center">
            <PixelIcon name="back" size={18} color={PALETTE.ink900} />
          </Pressable>
          <Text className="font-pixel-bold text-lg text-ink-900">{first.toLocaleDateString(t('en-PH', 'fil-PH'), { month: 'long', year: 'numeric' })}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('Next month', 'Susunod na buwan')} onPress={() => shift(1)} className="h-11 w-11 items-center justify-center">
            <PixelIcon name="arrow" size={18} color={PALETTE.ink900} />
          </Pressable>
        </View>
        <View className="flex-row">
          {weekdays.map((d, i) => (
            <Text key={`${d}-${i}`} className="flex-1 text-center font-pixel text-xs text-tara-700">
              {d}
            </Text>
          ))}
        </View>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} className="flex-row gap-1">
            {cells.slice(row * 7, row * 7 + 7).map((key, i) => {
              if (!key) return <View key={`e-${row}-${i}`} className="h-12 flex-1" />;
              const c = counts.get(key);
              const isSelected = key === selected;
              const isToday = key === todayKey;
              return (
                <Pressable key={key} accessibilityRole="button" accessibilityLabel={key} onPress={() => onPick(key)} className="flex-1">
                  <View className={`h-12 items-center justify-center gap-0.5 border-2 ${isSelected ? 'border-sipag-500 bg-sipag-300' : isToday ? 'border-ink-900 bg-banig-50' : 'border-banig-100 bg-banig-50'}`}>
                    <Text className="font-num text-sm text-ink-900">{Number(key.slice(8))}</Text>
                    <View className="flex-row gap-0.5">
                      {c?.done ? <View className="h-1.5 w-2.5 bg-leaf-500" /> : null}
                      {c?.planned ? <View className="h-1.5 w-2.5 bg-sipag-500" /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
        <View className="flex-row justify-center gap-4 pt-1">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-3 bg-leaf-500" />
            <Text className="text-xs text-tara-700">{t('Done', 'Tapos')}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-3 bg-sipag-500" />
            <Text className="text-xs text-tara-700">{t('Planned', 'Naka-plano')}</Text>
          </View>
        </View>
      </View>
    </PolyFrame>
  );
}
