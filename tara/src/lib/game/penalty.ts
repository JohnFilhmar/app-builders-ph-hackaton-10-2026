import { RULES } from '@/lib/game/constants';
import type { GameState, OpenQuest } from '@/lib/game/deriveState';

/**
 * Sipag lost for dropping a quest, clamped so it never pushes XP below the current level's floor: no level-downs,
 * and at level 1 with 0 Sipag nothing is taken.
 * @param state current derived state
 * @param reason cancelled by the user, or expired
 */
export function abortPenalty(state: Pick<GameState, 'totalXp' | 'level'>, reason: 'cancelled' | 'expired'): number {
  const wanted = reason === 'expired' ? RULES.expiredPenalty : RULES.cancelPenalty;
  return Math.max(0, Math.min(wanted, state.totalXp - state.level.floorXp));
}

/**
 * Whether cancelling costs Sipag: unscheduled quests always do, scheduled ones only once their time has passed
 * (moving a plan before it starts is free).
 * @param quest the open quest
 * @param now current time
 */
export const cancelCosts = (quest: Pick<OpenQuest, 'scheduled_at'>, now: number): boolean => !quest.scheduled_at || now >= quest.scheduled_at;

/**
 * Whether an open quest has sat undone past RULES.overdueHours, counted from its scheduled time or, when unscheduled,
 * from when it was declared.
 * @param quest the open quest
 * @param now current time
 */
export const isOverdue = (quest: Pick<OpenQuest, 'scheduled_at' | 'declared_at'>, now: number): boolean =>
  now - (quest.scheduled_at ?? quest.declared_at) > RULES.overdueHours * 3_600_000;

/**
 * Whether a scheduled quest finished late: after its time plus its planned minutes plus the grace window.
 * @param quest the open quest
 * @param now completion time
 */
export const isLate = (quest: Pick<OpenQuest, 'scheduled_at' | 'planned_minutes'>, now: number): boolean =>
  quest.scheduled_at !== undefined && now > quest.scheduled_at + (quest.planned_minutes + RULES.lateGraceMinutes) * 60_000;
