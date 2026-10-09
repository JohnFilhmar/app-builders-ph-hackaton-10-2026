import { dayKey } from '@/lib/game/days';
import type { GameEvent, ProofTier, QuestType } from '@/types/gameEvents';

export type DoneQuest = { quest_id: string; title: string; quest_type: QuestType; minutes: number; xp: number; tier: ProofTier };

/**
 * Quests finished on a given day, with the titles they were declared under, newest first.
 * @param events the ledger
 * @param todayKey day key from the derived state
 */
export function doneQuestsOn(events: GameEvent[], todayKey: string): DoneQuest[] {
  const titles = new Map<string, string>();
  const done: DoneQuest[] = [];
  for (const e of events) {
    if (e.type === 'quest_declared') titles.set(e.payload.quest_id, e.payload.title);
    if (e.type === 'quest_completed' && dayKey(e.at) === todayKey) {
      done.push({ quest_id: e.payload.quest_id, title: titles.get(e.payload.quest_id) ?? 'Gawain', quest_type: e.payload.quest_type, minutes: e.payload.minutes, xp: e.payload.xp, tier: e.payload.tier });
    }
  }
  return done.reverse();
}
