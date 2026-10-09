import type { ProofTier, QuestType } from '@/types/gameEvents';

export const QUEST_TYPES: readonly QuestType[] = ['linis', 'aral', 'basa', 'ehersisyo', 'sariling'];

export const LEVELS = [
  { level: 1, name: 'Baguhan', xp: 0 },
  { level: 2, name: 'Masigla', xp: 150 },
  { level: 3, name: 'Masipag', xp: 400 },
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
} as const;
