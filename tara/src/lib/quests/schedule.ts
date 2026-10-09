import type { Translate } from '@/lib/i18n/translate';
import type { GameEvent, QuestType } from '@/types/gameEvents';

export type ClockTime = { hour: number; minute: number };
export type When = { day?: 'today' | 'tomorrow'; time?: ClockTime };

const TOMORROW = /\b(tomorrow|tmrw|bukas)\b/i;
const TODAY = /\b(today|tonight|later|mamaya|ngayon)\b/i;

function toClock(hour: number, minute: number, meridiem: string | undefined): ClockTime | null {
  let h = hour;
  const m = meridiem?.toLowerCase() ?? '';
  if (/^p|hapon|gabi/.test(m) && h < 12) h += 12;
  if (/^a|umaga/.test(m) && h === 12) h = 0;
  return h >= 0 && h < 24 && minute >= 0 && minute < 60 ? { hour: h, minute } : null;
}

/**
 * The day and clock time in a message, read without AI: "tomorrow at 7pm", "bukas alas 6 ng umaga", "today 18:30".
 * A bare number like "30 mins" is never read as a time; it needs am/pm, a colon, or "at"/"alas" before it.
 * @param text what the user typed
 */
export function parseWhen(text: string): When {
  const when: When = {};
  if (TOMORROW.test(text)) when.day = 'tomorrow';
  else if (TODAY.test(text)) when.day = 'today';
  const patterns = [
    /\b(\d{1,2}):(\d{2})\s*(am|pm|a\.m\.|p\.m\.|ng umaga|ng hapon|ng gabi)?/i,
    /\b(\d{1,2})()\s*(am|pm|a\.m\.|p\.m\.)/i,
    /\b(?:at|alas)\s+(\d{1,2})()\s*(ng umaga|ng hapon|ng gabi)?/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (!m) continue;
    const clock = toClock(Number(m[1]), m[2] ? Number(m[2]) : 0, m[3]);
    if (clock) {
      when.time = clock;
      break;
    }
  }
  return when;
}

/**
 * Epoch ms for a day and clock time. Without a day, a time already past today moves to tomorrow.
 * @param when parsed day and time (time required)
 * @param now current epoch ms
 */
export function atTime(day: When['day'], time: ClockTime, now: number): number {
  const d = new Date(now);
  d.setHours(time.hour, time.minute, 0, 0);
  if (day === 'tomorrow') d.setDate(d.getDate() + 1);
  else if (day === undefined && d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/**
 * The user's usual time for a kind of quest: the clock time of the last one they scheduled. Null the first time,
 * which is when Tara asks.
 * @param events the ledger
 * @param type quest type
 */
export function usualTime(events: readonly GameEvent[], type: QuestType): ClockTime | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e?.type === 'quest_declared' && e.payload.quest_type === type && e.payload.scheduled_at) {
      const d = new Date(e.payload.scheduled_at);
      return { hour: d.getHours(), minute: d.getMinutes() };
    }
  }
  return null;
}

/** "Today 7:00 PM", "Tomorrow 6:30 AM" or a short date, in the app language. */
export function formatWhen(at: number, now: number, t: Translate): string {
  const d = new Date(at);
  const clock = d.toLocaleTimeString(t('en-PH', 'fil-PH'), { hour: 'numeric', minute: '2-digit' });
  const dayDiff = Math.round((new Date(at).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000);
  if (dayDiff === 0) return t(`Today ${clock}`, `Ngayon ${clock}`);
  if (dayDiff === 1) return t(`Tomorrow ${clock}`, `Bukas ${clock}`);
  return `${d.toLocaleDateString(t('en-PH', 'fil-PH'), { month: 'short', day: 'numeric' })} ${clock}`;
}
