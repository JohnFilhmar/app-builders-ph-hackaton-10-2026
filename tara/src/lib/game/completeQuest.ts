import { deriveState } from '@/lib/game/deriveState';
import { computeAward } from '@/lib/game/xp';
import type { GameEvent, ProofTier, QuestType } from '@/types/gameEvents';

let sequence = 0;

/**
 * Unique, time-ordered id for a new event.
 * @param prefix short label, e.g. "evt"
 */
export const newEventId = (prefix: string): string => `${prefix}_${Date.now().toString(36)}_${(sequence++).toString(36)}`;

export type CompletionInput = {
  quest_id: string;
  quest_type: QuestType;
  minutes: number;
  tier: ProofTier;
  disputed: boolean;
  /** scores only, never media: quiz_correct, quiz_total, read_seconds, offline (1 or 0) */
  evidence?: Record<string, number>;
};

/**
 * Builds the `quest_completed` event, with the award computed against the ledger as it stands now.
 * The XP is stored in the event so later rule changes never rewrite history.
 * @param events ledger before this completion
 * @param input the quest and its proof result
 * @param now completion time
 */
export function completeQuest(events: GameEvent[], input: CompletionInput, now: number): GameEvent {
  const state = deriveState(events, now);
  const award = computeAward({
    questType: input.quest_type,
    minutes: input.minutes,
    tier: input.tier,
    disputed: input.disputed,
    streakMultiplier: state.streak.multiplier,
    today: state.today,
  });
  return {
    id: newEventId('evt'),
    type: 'quest_completed',
    at: now,
    payload: {
      quest_id: input.quest_id,
      quest_type: input.quest_type,
      minutes: input.minutes,
      tier: award.tier,
      disputed: input.disputed,
      xp: award.xp,
      banked: award.banked,
      evidence: input.evidence ?? {},
    },
  };
}
