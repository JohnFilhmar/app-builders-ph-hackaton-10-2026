import { RULES } from '@/lib/game/constants';
import { addDays } from '@/lib/game/days';

export type StreakInfo = { current: number; best: number; beforeToday: number; multiplier: number; baonDays: number; baonUsedOn: string[] };

/**
 * Walks every day from the first active one to today. Active days grow the streak; a missed day spends a Baon Day
 * if one is held (earned every 7 streak days from level 3, at most 2) or resets the streak. Today never counts as missed.
 * @param activeDays days with at least one finished quest
 * @param todayKey today's day key
 * @param levelAtStartOf the player's level when a day began
 * @param clockFlagged true while the phone clock is behind the ledger
 */
export function walkStreak(activeDays: Set<string>, todayKey: string, levelAtStartOf: (day: string) => number, clockFlagged: boolean): StreakInfo {
  const first = [...activeDays].sort()[0];
  let streak = 0;
  let best = 0;
  let baon = 0;
  let sinceBaon = 0;
  let beforeToday = 0;
  const baonUsedOn: string[] = [];
  if (first) {
    for (let day = first; day <= todayKey; day = addDays(day, 1)) {
      if (day === todayKey) beforeToday = streak;
      if (activeDays.has(day)) {
        streak += 1;
        sinceBaon += 1;
        if (levelAtStartOf(day) >= RULES.baonLevel && sinceBaon >= RULES.baonEveryDays) {
          baon = Math.min(RULES.baonMax, baon + 1);
          sinceBaon = 0;
        }
      } else if (day !== todayKey) {
        if (baon > 0) {
          baon -= 1;
          baonUsedOn.push(day);
        } else {
          streak = 0;
          sinceBaon = 0;
        }
      }
      best = Math.max(best, streak);
    }
  }
  const multiplier = clockFlagged ? 1 : 1 + RULES.streakStep * Math.min(beforeToday, RULES.streakMaxDays);
  return { current: streak, best, beforeToday, multiplier: Math.round(multiplier * 100) / 100, baonDays: baon, baonUsedOn };
}
