import { RULES, TIER_MULTIPLIER } from '@/lib/game/constants';
import type { ProofTier, QuestType } from '@/types/gameEvents';

export type DayTally = { questXp: number; sabiKoXp: number; countByType: Record<QuestType, number> };

/** A day with nothing done yet. */
export const emptyTally = (): DayTally => ({
  questXp: 0,
  sabiKoXp: 0,
  countByType: { linis: 0, aral: 0, basa: 0, ehersisyo: 0, sariling: 0 },
});

export type AwardInput = { questType: QuestType; minutes: number; tier: ProofTier; disputed: boolean; streakMultiplier: number; today: DayTally };
export type Award = { tier: ProofTier; xp: number; banked: number; capped: null | 'repeat_limit' | 'sabi_ko_cap' | 'daily_cap' };

/**
 * XP for one finished quest: clamped minutes x tier x streak, then the repeat limit, Sabi Ko cap and daily cap.
 * A dispute pays at Sabi Ko and banks whatever a cap blocks, so a real effort never pays zero.
 * @param input the quest, its proof result and today's totals so far
 */
export function computeAward(input: AwardInput): Award {
  const tier: ProofTier = input.disputed ? 'sabi_ko' : input.tier;
  if (input.today.countByType[input.questType] >= RULES.repeatLimit) return { tier, xp: 0, banked: 0, capped: 'repeat_limit' };

  const minutes = Math.min(RULES.maxMinutes, Math.max(RULES.minMinutes, Math.round(input.minutes)));
  const raw = Math.round(minutes * TIER_MULTIPLIER[tier] * input.streakMultiplier);
  let xp = raw;
  let capped: Award['capped'] = null;
  if (tier === 'sabi_ko') {
    const room = Math.max(0, RULES.sabiKoDailyCap - input.today.sabiKoXp);
    if (xp > room) {
      xp = room;
      capped = 'sabi_ko_cap';
    }
  }
  const dayRoom = Math.max(0, RULES.dailyQuestCap - input.today.questXp);
  if (xp > dayRoom) {
    xp = dayRoom;
    capped = 'daily_cap';
  }
  return { tier, xp, banked: input.disputed ? raw - xp : 0, capped };
}
