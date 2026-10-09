import { scheduleQuestReminder } from '@/lib/alerts/questReminders';
import { newEventId } from '@/lib/game/completeQuest';
import type { GameEvent, QuestType } from '@/types/gameEvents';

export type QuestDraft = { title: string; quest_type: QuestType; planned_minutes: number; scheduled_at?: number };

/**
 * Records a declared quest in the ledger and, when it has a time, schedules its reminder. Shared by the quest form
 * and Tara's chat so both behave the same.
 * @param append the game store's append
 * @param draft what the user confirmed
 * @returns the new quest's id
 */
export function declareQuest(append: (event: GameEvent) => void, draft: QuestDraft): string {
  const questId = newEventId('q');
  const title = draft.title.trim();
  append({ id: newEventId('evt'), type: 'quest_declared', at: Date.now(), payload: { quest_id: questId, ...draft, title } });
  if (draft.scheduled_at) void scheduleQuestReminder({ quest_id: questId, title, scheduled_at: draft.scheduled_at });
  return questId;
}
