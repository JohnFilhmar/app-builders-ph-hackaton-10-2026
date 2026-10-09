import { runAi } from '@/lib/ai/runAi';
import { splitTasks } from '@/lib/chat/splitTasks';
import { tr } from '@/lib/i18n/translate';
import type { QuestDraft } from '@/lib/quests/declareQuest';
import { classifyQuest } from '@/lib/quests/questTypes';
import { atTime, parseWhen, usualTime } from '@/lib/quests/schedule';
import type { GameEvent } from '@/types/gameEvents';

/** A drafted quest; `needs_time` means the user named a day but Tara has no usual time for this kind of quest yet. */
export type PlannedDraft = QuestDraft & { needs_time: boolean };

/**
 * Turns a chat message into quest drafts for the user to confirm. Splitting, type and time are all rule-based (the
 * 1B model was unreliable at it); nothing here sets points. A named day without a time takes the user's usual time for
 * that quest type, or is flagged so Tara can ask.
 * @param message what the user typed or said
 * @param events the ledger, for usual times
 * @param level current level; exercise quests unlock at 2
 */
export function planQuests(message: string, events: readonly GameEvent[], level: number): PlannedDraft[] {
  const raw = splitTasks(message).map((title) => {
    const guess = classifyQuest(title);
    return { title, quest_type: guess.type, minutes: guess.minutes };
  });

  const when = parseWhen(message);
  const now = Date.now();
  return raw.map((q) => {
    const type = q.quest_type === 'ehersisyo' && level < 2 ? 'sariling' : q.quest_type;
    const draft: PlannedDraft = { title: q.title, quest_type: type, planned_minutes: q.minutes, needs_time: false };
    if (!when.day && !when.time) return draft;
    const time = when.time ?? usualTime(events, type);
    if (time) draft.scheduled_at = atTime(when.day, time, now);
    else draft.needs_time = true;
    return draft;
  });
}

// chat templates like Gemma's reject two turns in a row from the same side, so those are merged; the first turn must be the user's
function alternate(turns: { role: 'user' | 'assistant'; content: string }[]): { role: 'user' | 'assistant'; content: string }[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const turn of turns) {
    const last = out.at(-1);
    if (last?.role === turn.role) last.content = `${last.content}
${turn.content}`;
    else if (out.length > 0 || turn.role === 'user') out.push({ ...turn });
  }
  return out;
}

/**
 * Open chat with Tara on the "brain" model, streamed. Short answers, kind tone, English first.
 * @param history the conversation so far, oldest first
 * @param onToken receives the reply so far
 */
export async function askTara(history: { role: 'user' | 'assistant'; content: string }[], onToken: (soFar: string) => void): Promise<string> {
  const out = await runAi('brain',
    [
      {
        role: 'system',
        content: tr(
          'You are Tara, a friendly tarsier who helps Filipino students and families with their day. Answer in 1 to 3 short sentences. Be kind and practical. If you are not sure, say so.',
          'You are Tara, a friendly tarsier who helps Filipino students and families with their day. Answer in simple Taglish, 1 to 3 short sentences. Be kind and practical. If you are not sure, say so.',
        ),
      },
      ...alternate(history.slice(-6)),
    ],
    onToken,
    undefined,
    { maxTokens: 200, temperature: 0.6 },
  );
  return out.text.trim();
}
