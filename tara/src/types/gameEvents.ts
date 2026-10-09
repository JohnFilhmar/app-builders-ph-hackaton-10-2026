import { z } from 'zod';

export const questTypeSchema = z.enum(['linis', 'aral', 'basa', 'ehersisyo', 'sariling']);
export const proofTierSchema = z.enum(['sabi_ko', 'nakita', 'patunay']);
export const baseAvatarSchema = z.enum(['male', 'female']);

const meta = { id: z.string().min(1), at: z.number().int().nonnegative() };

/** The one schema for every ledger event. Payload keys are snake_case; they travel in backup files as-is. */
export const gameEventSchema = z.discriminatedUnion('type', [
  z.object({ ...meta, type: z.literal('profile_created'), payload: z.object({ base_avatar: baseAvatarSchema }) }),
  z.object({
    ...meta,
    type: z.literal('quest_declared'),
    payload: z.object({ quest_id: z.string(), title: z.string(), quest_type: questTypeSchema, planned_minutes: z.number().positive() }),
  }),
  z.object({
    ...meta,
    type: z.literal('quest_completed'),
    payload: z.object({
      quest_id: z.string(),
      quest_type: questTypeSchema,
      minutes: z.number().nonnegative(),
      tier: proofTierSchema,
      disputed: z.boolean(),
      xp: z.number().int().nonnegative(),
      banked: z.number().int().nonnegative(),
      evidence: z.record(z.string(), z.number()),
    }),
  }),
  z.object({ ...meta, type: z.literal('comeback_awarded'), payload: z.object({ xp: z.number().int().nonnegative() }) }),
  z.object({ ...meta, type: z.literal('pabuya_created'), payload: z.object({ pabuya_id: z.string(), title: z.string(), price: z.number().int().positive() }) }),
  z.object({ ...meta, type: z.literal('pabuya_claimed'), payload: z.object({ pabuya_id: z.string() }) }),
  z.object({ ...meta, type: z.literal('app_opened'), payload: z.object({}) }),
]);

export type GameEvent = z.infer<typeof gameEventSchema>;
export type QuestType = z.infer<typeof questTypeSchema>;
export type ProofTier = z.infer<typeof proofTierSchema>;
export type BaseAvatar = z.infer<typeof baseAvatarSchema>;
export type AchievementId =
  | 'unang_hakbang'
  | 'unang_patunay'
  | 'malinis_na_kwarto'
  | 'tatlong_araw'
  | 'isang_linggo'
  | 'perpekto'
  | 'basa_bida'
  | 'pabuya_natanggap'
  | 'walang_signal';
