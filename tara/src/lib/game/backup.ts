import { z } from 'zod';

import { gameEventSchema, type GameEvent } from '@/types/gameEvents';

const backupSchema = z.object({
  format: z.literal('tara-backup'),
  version: z.literal(1),
  exported_at: z.number(),
  events: z.array(gameEventSchema),
});

/**
 * Serializes the ledger into the "I-save ang progreso" file.
 * @param events the full ledger
 * @param now export time
 */
export function exportBackup(events: GameEvent[], now: number): string {
  return JSON.stringify({ format: 'tara-backup', version: 1, exported_at: now, events });
}

/**
 * Validates a backup file before anything is replaced. Never throws.
 * @param text the file contents
 */
export function parseBackup(text: string): { ok: true; events: GameEvent[] } | { ok: false; reason: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'Hindi mabasa ang file (not a Tara backup).' };
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) return { ok: false, reason: 'Hindi ito Tara backup, o sira ang file (not a valid Tara backup).' };
  return { ok: true, events: parsed.data.events };
}
