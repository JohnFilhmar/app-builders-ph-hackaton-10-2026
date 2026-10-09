import { activeModel } from '@/lib/ai/activeModel';
import { tr } from '@/lib/i18n/translate';
import { runLlamaChat } from '@/lib/runtimes/llamaRuntime';
import type { CheckOutcome } from '@/types/quest';

// an inventory with counts lets the brain notice removed items ("2 cups" before, none after), which one-line captions miss
const DESCRIBE = 'List every object you can see in this photo, one per line, with how many there are. Example:\n2 cups\n1 plate\n1 table';
const PERSON = /\b(person|people|man|woman|boy|girl|child|kid|lady|guy)\b/i;
const noop = () => undefined;

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    done: { type: 'boolean' },
    tara: { type: 'string' },
  },
  required: ['done', 'tara'],
} as const;

/**
 * Tara's Before & After check: the "eyes" model describes both photos, then the "brain" model judges whether the
 * declared task visibly happened and writes one friendly sentence about what changed. English first; Tagalog
 * improves later by changing models in the backend catalog.
 * @param task the quest title the user declared
 * @param beforeUri Before photo (in-app camera)
 * @param afterUri After photo (in-app camera)
 * @param onStage progress text for the waiting screen
 */
export async function checkBeforeAfter(task: string, beforeUri: string, afterUri: string, onStage: (stage: string) => void): Promise<CheckOutcome> {
  const eyes = activeModel('eyes');
  onStage(tr('Tara is looking at your Before photo...', 'Tinitingnan ni Tara ang Before photo...'));
  const before = await runLlamaChat(eyes, [{ role: 'user', content: DESCRIBE }], noop, beforeUri, { maxTokens: 140, temperature: 0.1 });
  onStage(tr('Tara is looking at your After photo...', 'Tinitingnan ni Tara ang After photo...'));
  const after = await runLlamaChat(eyes, [{ role: 'user', content: DESCRIBE }], noop, afterUri, { maxTokens: 140, temperature: 0.1 });

  if (PERSON.test(after.text) || PERSON.test(before.text)) {
    return { verdict: 'person', said: tr("There's a person in the photo. Retake just the spot you cleaned?", 'May tao sa litrato. Kunan ulit ang nilinis na lugar lang?'), evidence: {} };
  }

  onStage(tr('Tara is comparing them...', 'Pinaghahambing ni Tara...'));
  const brain = activeModel('brain');
  const judged = await runLlamaChat(
    brain,
    [
      {
        role: 'system',
        content:
          'You are Tara, a kind tarsier who checks proof that a chore was done. You never judge the person, their home or how nice things look. Only decide if the After photo shows the task was done compared with Before.',
      },
      { role: 'user', content: `Task: ${task}\nObjects in the Before photo:\n${before.text}\n\nObjects in the After photo:\n${after.text}\n\nCompare the two lists. Items that are gone, fewer, or put away in the After photo mean tidying happened. Was the task done? Set "done", and in "tara" write one short cheerful sentence naming what changed, like "The 2 cups are gone from the table!"` },
    ],
    noop,
    undefined,
    { maxTokens: 120, temperature: 0.2, responseFormat: { type: 'json_schema', json_schema: { strict: true, schema: VERDICT_SCHEMA } } },
  );

  let done = false;
  let line = '';
  try {
    const parsed: unknown = JSON.parse(judged.text);
    if (parsed && typeof parsed === 'object' && 'done' in parsed && 'tara' in parsed) {
      done = parsed.done === true;
      line = typeof parsed.tara === 'string' ? parsed.tara : '';
    }
  } catch {
    done = false;
  }
  return done
    ? { verdict: 'patunay', said: line || tr('I can see the change. Great job!', 'Kita ko ang pagbabago. Ang galing!'), evidence: {} }
    : { verdict: 'not_confirmed', said: tr("I couldn't confirm it from the photos. The After photo looked about the same to me. A closer, brighter photo of the same spot helps.", 'Hindi ko makumpirma sa mga litrato. Parang pareho ang After photo. Makakatulong ang mas malapit at mas maliwanag na kuha.'), evidence: {} };
}
