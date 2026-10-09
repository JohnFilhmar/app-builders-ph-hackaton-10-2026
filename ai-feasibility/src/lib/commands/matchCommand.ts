import type { Catalog } from '@/types/catalog';

/**
 * Maps a transcript to a voice-command intent by phrase containment (English or Tagalog phrases from the catalog).
 * Returns null when nothing matches.
 * @param transcript STT output
 * @param commands catalog command list
 */
export function matchCommand(transcript: string, commands: Catalog['commands']): string | null {
  const text = transcript.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  for (const command of commands) {
    if (command.phrases.some((p) => text.includes(p.toLowerCase()))) return command.intent;
  }
  return null;
}
