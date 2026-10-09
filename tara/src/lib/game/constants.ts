import type { ProofTier, QuestType } from '@/types/gameEvents';

export const QUEST_TYPES: readonly QuestType[] = ['linis', 'aral', 'basa', 'ehersisyo', 'sariling'];

export const LEVELS = [
  { level: 1, name: 'Baguhan · Beginner', xp: 0 },
  { level: 2, name: 'Masigla · Lively', xp: 150 },
  { level: 3, name: 'Masipag · Hardworking', xp: 400 },
  { level: 4, name: 'Matiyaga · Patient', xp: 700 },
  { level: 5, name: 'Masikap · Diligent', xp: 1050 },
  { level: 6, name: 'Matatag · Steadfast', xp: 1450 },
  { level: 7, name: 'Magiting · Valiant', xp: 1900 },
  { level: 8, name: 'Bihasa · Skilled', xp: 2400 },
  { level: 9, name: 'Dakila · Great', xp: 2950 },
  { level: 10, name: 'Alamat · Legend', xp: 3550 },
] as const;

export const TIER_MULTIPLIER: Record<ProofTier, number> = { sabi_ko: 1, nakita: 2, patunay: 3 };

export const RULES = {
  minMinutes: 10,
  maxMinutes: 60,
  sabiKoDailyCap: 60,
  dailyQuestCap: 300,
  repeatLimit: 3,
  streakStep: 0.05,
  streakMaxDays: 10,
  comebackDays: 3,
  comebackXp: 20,
  baonLevel: 3,
  baonEveryDays: 7,
  baonMax: 2,
  /** Sipag lost when cancelling an unscheduled or overdue quest */
  cancelPenalty: 5,
  /** Sipag lost when a quest sits undone past overdueHours and expires */
  expiredPenalty: 10,
  overdueHours: 6,
  /** a scheduled quest finished later than its time plus its minutes plus this grace earns lateFactor of its XP */
  lateGraceMinutes: 30,
  lateFactor: 0.75,
} as const;
