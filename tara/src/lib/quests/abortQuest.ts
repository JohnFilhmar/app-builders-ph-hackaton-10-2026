import { cancelQuestReminder } from '@/lib/alerts/questReminders';
import { newEventId } from '@/lib/game/completeQuest';
import type { OpenQuest } from '@/lib/game/deriveState';
import { abortPenalty, cancelCosts, isOverdue } from '@/lib/game/penalty';
import { useGameStore } from '@/lib/stores/gameStore';
import { useQuestStore } from '@/lib/stores/questStore';

/**
 * Drops an open quest: records the clamped penalty in the ledger, clears its working data and cancels its reminder.
 * @param quest the open quest
 * @param reason the user cancelled it, or it expired
 * @returns Sipag taken
 */
export function abortQuest(quest: OpenQuest, reason: 'cancelled' | 'expired'): number {
  const { state, append } = useGameStore.getState();
  const penalty = reason === 'cancelled' && !cancelCosts(quest, Date.now()) ? 0 : abortPenalty(state, reason);
  append({ id: newEventId('evt'), type: 'quest_aborted', at: Date.now(), payload: { quest_id: quest.quest_id, reason, penalty } });
  useQuestStore.getState().clear(quest.quest_id);
  void cancelQuestReminder(quest.quest_id);
  return penalty;
}

/**
 * Expires every open quest left undone past the overdue window. Safe to call often; each quest expires once.
 * @returns how many expired
 */
export function expireOverdue(): number {
  const now = Date.now();
  const overdue = useGameStore.getState().state.openQuests.filter((q) => isOverdue(q, now));
  for (const q of overdue) abortQuest(q, 'expired');
  return overdue.length;
}
