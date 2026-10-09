import { completeQuest } from '@/lib/game/completeQuest';
import type { GameEvent, ProofTier, QuestType } from '@/types/gameEvents';

const DAY = 86_400_000;

// Active every other day: no streak bonus (the spec's +45 needs 1x) and gaps under 3 days (no comeback).
const PLAN: readonly [daysAgo: number, type: QuestType, minutes: number, tier: ProofTier][] = [
  [10, 'linis', 30, 'patunay'],
  [8, 'aral', 30, 'patunay'],
  [6, 'linis', 30, 'patunay'],
  [4, 'basa', 30, 'patunay'],
  [2, 'sariling', 10, 'sabi_ko'],
];

/**
 * The stage ledger: 370 XP (30 short of Masipag), level 2, streak multiplier 1, one Pabuya.
 * Built through `completeQuest`, so its numbers always follow the live rules.
 * @param now the moment the demo starts
 */
export function buildDemoEvents(now: number): GameEvent[] {
  const events: GameEvent[] = [{ id: 'demo_profile', type: 'profile_created', at: now - 11 * DAY, payload: { base_avatar: 'female' } }];
  for (const [daysAgo, quest_type, minutes, tier] of PLAN) {
    events.push(completeQuest(events, { quest_id: `demo_q${daysAgo}`, quest_type, minutes, tier, disputed: false }, now - daysAgo * DAY));
  }
  events.push({ id: 'demo_pabuya', type: 'pabuya_created', at: now - 2 * DAY + 1000, payload: { pabuya_id: 'pabuya_milk_tea', title: 'Milk tea', price: 500 } });
  return events;
}
