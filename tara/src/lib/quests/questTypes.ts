import type { QuestType } from '@/types/gameEvents';
import type { QuestTypeInfo } from '@/types/quest';

export const QUEST_INFO: Record<QuestType, QuestTypeInfo> = {
  linis: { type: 'linis', label: 'Linis', english: 'Clean', defaultMinutes: 15, proofHint: 'Before & After photos' },
  aral: { type: 'aral', label: 'Aral', english: 'Study', defaultMinutes: 30, proofHint: 'A quiz from your notes' },
  basa: { type: 'basa', label: 'Basa Nang Malakas', english: 'Read aloud', defaultMinutes: 10, proofHint: 'Read a page aloud' },
  ehersisyo: { type: 'ehersisyo', label: 'Ehersisyo', english: 'Exercise', defaultMinutes: 15, proofHint: 'Count your reps aloud' },
  sariling: { type: 'sariling', label: 'Sariling Gawain', english: 'Own task', defaultMinutes: 30, proofHint: 'Your word (Sabi Ko)' },
};

const KEYWORDS: [QuestType, RegExp][] = [
  ['linis', /\b(linis|ayos|ayusin|walis|hugas|laba|kama|kwarto|mesa|clean|tidy|sweep|wash|dishes|bed|room|desk|laundry)\b/i],
  ['aral', /\b(aral|study|review|homework|assignment|notes|exam|quiz|reviewer|lesson|module)\b/i],
  ['basa', /\b(basa|read|reading|libro|book|story|kwento|chapter)\b/i],
  ['ehersisyo', /\b(ehersisyo|exercise|squat|squats|push ?ups?|sit ?ups?|jog|takbo|run|workout|jumping)\b/i],
];

/**
 * Tara's instant suggestion for a typed quest: a type and a duration. Keyword rules, no model, so it never waits
 * and never refuses; the user can change anything.
 * @param text what the user typed, e.g. "Linis ng kwarto, 30 mins"
 */
export function classifyQuest(text: string): { type: QuestType; minutes: number } {
  const type = KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? 'sariling';
  const minutesMatch = text.match(/(\d{1,3})\s*(m|min|mins|minutes|minuto)\b/i);
  const minutes = minutesMatch?.[1] ? Math.min(120, Math.max(5, Number(minutesMatch[1]))) : QUEST_INFO[type].defaultMinutes;
  return { type, minutes };
}

export type Passage = { id: string; lang: 'en' | 'tl'; title: string; text: string };

/** Built-in pages for Basa Nang Malakas. English first; Tagalog included for practice. */
export const PASSAGES: Passage[] = [
  {
    id: 'en_typhoon',
    lang: 'en',
    title: 'Getting ready for a typhoon',
    text: 'Before a typhoon arrives, fill clean containers with drinking water. Charge your phone and a power bank. Keep a flashlight, extra batteries and a small first aid kit in one bag. Listen for advisories and know the way to the nearest evacuation center.',
  },
  {
    id: 'en_jeepney',
    lang: 'en',
    title: 'The jeepney',
    text: 'The jeepney is the king of the Philippine road. Each one is painted by hand with bright colors and names. Passengers pass their fare to the driver from seat to seat, and everyone helps. A short ride is cheap, noisy and full of stories.',
  },
  {
    id: 'tl_bagyo',
    lang: 'tl',
    title: 'Paghahanda sa bagyo',
    text: 'Bago dumating ang bagyo, mag-ipon ng malinis na tubig na maiinom. I-charge ang cellphone at ang power bank. Ilagay sa isang bag ang flashlight, mga baterya at gamot. Makinig sa balita at alamin ang daan papunta sa evacuation center.',
  },
];

/** Vocabulary hint for counting aloud, so the speech model expects numbers in either language. */
// no numbers here: on a silent slice whisper can echo its prompt, and an echoed "twenty" would read as 20 reps
export const COUNTING_PROMPT = 'Counting exercise reps out loud, in English or Tagalog.';
