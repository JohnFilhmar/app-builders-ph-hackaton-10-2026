import { runAi } from '@/lib/ai/runAi';
import { readNotes } from '@/lib/checks/notesQuiz';
import { PASSAGES, type Passage } from '@/lib/quests/questTypes';

const MIN_WORDS = 20;
// about a minute aloud: long enough to prove reading, short enough that a page photo does not become a chore
const MAX_WORDS = 110;
const TL_WORDS = new Set(['ang', 'ng', 'sa', 'mga', 'na', 'ay', 'at', 'ito', 'si', 'ni', 'para', 'hindi', 'kung']);

/** Everyday topics for "Surprise me", close to a Filipino student's day. */
export const SURPRISE_TOPICS = [
  'a rainy day in the barangay',
  'how rice grows in the field',
  'a visit to the wet market',
  'the life of a carabao',
  'why we save water',
  'a jeepney ride to school',
  'the water cycle',
  'Jose Rizal as a boy',
  'taking care of a pet',
  'a fiesta in town',
  'how volcanoes form',
  'eating vegetables for strength',
];

/**
 * Tidies model or OCR text into a readable page: drops markdown, quotes and a "Here is..." lead-in, joins lines, and
 * cuts at a sentence end near MAX_WORDS. Throws when fewer than MIN_WORDS are left.
 * @param raw text from a model or a page photo
 */
export function cleanPassage(raw: string): { text: string; lang: Passage['lang'] } {
  const lines = raw
    .replace(/[*_#`>]+/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 1 && /:\s*$/.test(lines[0] ?? '')) lines.shift();
  const words = lines.join(' ').replace(/^["'“”]+|["'“”]+$/g, '').replace(/\s+/g, ' ').trim().split(' ');
  if (words.length < MIN_WORDS) throw new Error(`Only ${words.length} words, need at least ${MIN_WORDS}`);
  let cut = words.slice(0, MAX_WORDS).join(' ');
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (words.length > MAX_WORDS && end > cut.length / 2) cut = cut.slice(0, end + 1);
  const tlHits = words.filter((w) => TL_WORDS.has(w.toLowerCase().replace(/[^a-z]/g, ''))).length;
  return { text: cut, lang: tlHits / words.length > 0.08 ? 'tl' : 'en' };
}

/**
 * A page from a photo of a textbook or book, read by the "eyes" model.
 * @param photoUri the in-app camera photo
 */
export async function passageFromPhoto(photoUri: string): Promise<Passage> {
  const { text, lang } = cleanPassage(await readNotes(photoUri));
  return { id: `photo_${Date.now()}`, lang, title: lang === 'tl' ? 'Ang pahina mo' : 'Your page', text };
}

/**
 * A short page the "brain" model writes about a topic. Without a topic it picks one from SURPRISE_TOPICS; if the
 * model fails or writes too little, a random built-in page stands in, so reading never dead-ends.
 * @param topic what to write about, or undefined to be surprised
 * @param lang language of the page
 */
export async function writePassage(topic: string | undefined, lang: Passage['lang']): Promise<Passage> {
  const subject = topic?.trim() || SURPRISE_TOPICS[Math.floor(Math.random() * SURPRISE_TOPICS.length)] || 'the water cycle';
  try {
    const out = await runAi(
      'brain',
      [
        { role: 'system', content: 'You write short reading passages for Filipino students to read aloud. Plain text only: no title, no lists, no quotes.' },
        { role: 'user', content: `Write one paragraph of 50 to 70 words about ${subject}${lang === 'tl' ? ', in Tagalog' : ', in simple English'}. Use short, clear sentences.` },
      ],
      () => undefined,
      undefined,
      { maxTokens: 220, temperature: 0.7 },
    );
    const { text } = cleanPassage(out.text);
    return { id: `ai_${Date.now()}`, lang, title: subject.charAt(0).toUpperCase() + subject.slice(1), text };
  } catch {
    const builtIns = PASSAGES.filter((p) => p.lang === lang);
    const pick = builtIns[Math.floor(Math.random() * builtIns.length)] ?? PASSAGES[0];
    if (!pick) throw new Error('No reading pages available');
    return pick;
  }
}
