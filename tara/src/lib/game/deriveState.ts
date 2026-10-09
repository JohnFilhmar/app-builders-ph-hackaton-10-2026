import { RULES } from '@/lib/game/constants';
import { addDays, dayKey, daysBetween } from '@/lib/game/days';
import { levelForXp, type LevelInfo } from '@/lib/game/levels';
import { walkStreak, type StreakInfo } from '@/lib/game/streak';
import { emptyTally, type DayTally } from '@/lib/game/xp';
import type { AchievementId, BaseAvatar, GameEvent, QuestType } from '@/types/gameEvents';

export type PabuyaItem = { id: string; title: string; price: number; claimed: boolean };
export type OpenQuest = { quest_id: string; title: string; quest_type: QuestType; planned_minutes: number };
export type GameState = {
  todayKey: string;
  totalXp: number;
  level: LevelInfo;
  pabuyaBalance: number;
  streak: StreakInfo;
  today: DayTally;
  clockFlagged: boolean;
  comebackDue: boolean;
  achievements: AchievementId[];
  pabuya: PabuyaItem[];
  baseAvatar: BaseAvatar | null;
  openQuests: OpenQuest[];
};

const sumXp = (byDay: Map<string, number>, include: (day: string) => boolean): number =>
  [...byDay].reduce((total, [day, xp]) => (include(day) ? total + xp : total), 0);

/**
 * Folds the ledger into everything the screens show. Pure: same events and time give the same state,
 * and no model is ever re-run, because each quest's XP was stored when it finished.
 * @param events the full ledger, any order
 * @param now the current time, epoch milliseconds
 */
export function deriveState(events: GameEvent[], now: number): GameState {
  const sorted = [...events].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  const todayKey = dayKey(now);
  const clockFlagged = now < sorted.reduce((latest, e) => Math.max(latest, e.at), 0);
  const xpByDay = new Map<string, number>();
  const addXp = (day: string, xp: number) => xpByDay.set(day, (xpByDay.get(day) ?? 0) + xp);
  const activeDays = new Set<string>();
  const today = emptyTally();
  const pabuya = new Map<string, PabuyaItem>();
  const open = new Map<string, OpenQuest>();
  const achieved = new Set<AchievementId>();
  let baseAvatar: BaseAvatar | null = null;
  let spent = 0;
  let linisPatunay = 0;
  let readSeconds = 0;
  let lastActive: string | null = null;
  let comebackSinceLastActive = false;

  for (const e of sorted) {
    switch (e.type) {
      case 'profile_created':
        baseAvatar = e.payload.base_avatar;
        break;
      case 'quest_declared':
        open.set(e.payload.quest_id, { ...e.payload });
        break;
      case 'quest_completed': {
        const p = e.payload;
        const day = dayKey(e.at);
        open.delete(p.quest_id);
        activeDays.add(day);
        lastActive = day;
        comebackSinceLastActive = false;
        addXp(day, p.xp);
        // banked XP lands the next morning and never counts toward that day's caps
        if (p.banked > 0) addXp(addDays(day, 1), p.banked);
        if (day === todayKey) {
          today.questXp += p.xp;
          today.countByType[p.quest_type] += 1;
          if (p.tier === 'sabi_ko') today.sabiKoXp += p.xp;
        }
        achieved.add('unang_hakbang');
        if (p.tier === 'patunay') {
          achieved.add('unang_patunay');
          if (p.quest_type === 'linis') linisPatunay += 1;
          if (p.evidence.offline === 1) achieved.add('walang_signal');
        }
        const quizTotal = p.evidence.quiz_total ?? 0;
        if (p.quest_type === 'aral' && quizTotal > 0 && p.evidence.quiz_correct === quizTotal) achieved.add('perpekto');
        if (p.quest_type === 'basa') readSeconds += p.evidence.read_seconds ?? 0;
        break;
      }
      case 'comeback_awarded':
        addXp(dayKey(e.at), e.payload.xp);
        comebackSinceLastActive = true;
        break;
      case 'pabuya_created':
        pabuya.set(e.payload.pabuya_id, { id: e.payload.pabuya_id, title: e.payload.title, price: e.payload.price, claimed: false });
        break;
      case 'pabuya_claimed': {
        const item = pabuya.get(e.payload.pabuya_id);
        if (item && !item.claimed) {
          item.claimed = true;
          spent += item.price;
          achieved.add('pabuya_natanggap');
        }
        break;
      }
      case 'app_opened':
        break;
    }
  }
  if (linisPatunay >= 10) achieved.add('malinis_na_kwarto');
  if (readSeconds >= 30 * 60) achieved.add('basa_bida');

  const totalXp = sumXp(xpByDay, (day) => day <= todayKey);
  const levelAtStartOf = (day: string) => levelForXp(sumXp(xpByDay, (d) => d < day)).level;
  const streak = walkStreak(activeDays, todayKey, levelAtStartOf, clockFlagged);
  if (streak.best >= 3) achieved.add('tatlong_araw');
  if (streak.best >= 7) achieved.add('isang_linggo');
  const comebackDue =
    !clockFlagged && lastActive !== null && !comebackSinceLastActive && daysBetween(lastActive, todayKey) >= RULES.comebackDays;

  return {
    todayKey,
    totalXp,
    level: levelForXp(totalXp),
    pabuyaBalance: totalXp - spent,
    streak,
    today,
    clockFlagged,
    comebackDue,
    achievements: [...achieved],
    pabuya: [...pabuya.values()],
    baseAvatar,
    openQuests: [...open.values()],
  };
}
