import { dayKey } from '@/lib/game/days';
import type { OpenQuest } from '@/lib/game/deriveState';
import type { GameEvent } from '@/types/gameEvents';

export type DayCount = { done: number; planned: number };

/**
 * How many quests were finished and how many are planned on each day, for the calendar dots.
 * @param events the ledger
 * @param openQuests quests not finished yet; only scheduled ones land on a day
 */
export function questCountsByDay(events: readonly GameEvent[], openQuests: readonly OpenQuest[]): Map<string, DayCount> {
  const counts = new Map<string, DayCount>();
  const bump = (key: string, field: keyof DayCount) => {
    const c = counts.get(key) ?? { done: 0, planned: 0 };
    c[field] += 1;
    counts.set(key, c);
  };
  for (const e of events) if (e.type === 'quest_completed') bump(dayKey(e.at), 'done');
  for (const q of openQuests) if (q.scheduled_at) bump(dayKey(q.scheduled_at), 'planned');
  return counts;
}

/**
 * Open quests that belong to a day: scheduled on it, or unscheduled and the day is today.
 * @param openQuests quests not finished yet
 * @param key the day shown
 * @param todayKey today
 */
export function openQuestsOn(openQuests: readonly OpenQuest[], key: string, todayKey: string): OpenQuest[] {
  return openQuests
    .filter((q) => (q.scheduled_at ? dayKey(q.scheduled_at) === key : key === todayKey))
    .sort((a, b) => (a.scheduled_at ?? 0) - (b.scheduled_at ?? 0));
}
