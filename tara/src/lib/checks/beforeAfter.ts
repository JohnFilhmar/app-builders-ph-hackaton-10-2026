import { runAi } from '@/lib/ai/runAi';
import { mentionedObjects, saidYes } from '@/lib/checks/objectList';
import { tr } from '@/lib/i18n/translate';
import type { CheckOutcome } from '@/types/quest';
import { parseModelJson } from '@/utils/parseModelJson';

// SmolVLM answers a list-with-example prompt with a bare count ("3."), so it describes freely and code picks out the objects
const DESCRIBE = 'Describe this photo in detail. Mention every object you can see.';
const PERSON = /\b(person|people|man|woman|boy|girl|child|kid|lady|guy)\b/i;
const noop = () => undefined;
// small clutter the open list often leaves out; probed even when the model did not name them
const COMMON_CLUTTER = ['cup', 'bottle', 'plate'];

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
  onStage(tr('Tara is looking at your Before photo...', 'Tinitingnan ni Tara ang Before photo...'));
  const before = await runAi('eyes', [{ role: 'user', content: DESCRIBE }], noop, beforeUri, { maxTokens: 140, temperature: 0.1 });
  onStage(tr('Tara is looking at your After photo...', 'Tinitingnan ni Tara ang After photo...'));
  const after = await runAi('eyes', [{ role: 'user', content: DESCRIBE }], noop, afterUri, { maxTokens: 140, temperature: 0.1 });
  console.log(`[linis] descriptions: ${before.text.length}/${after.text.length} chars`);
  // the judge would be guessing from nothing, so a blank description never confirms a quest
  if (!before.text.trim() || !after.text.trim()) {
    return {
      verdict: 'not_confirmed',
      said: tr("I couldn't make out the photos this time. Try again with closer, brighter photos of the same spot.", 'Hindi ko maaninag ang mga litrato ngayon. Subukan ulit nang mas malapit at mas maliwanag na kuha ng parehong puwesto.'),
      evidence: {},
    };
  }

  if (PERSON.test(after.text) || PERSON.test(before.text)) {
    return { verdict: 'person', said: tr("There's a person in the photo. Retake just the spot you cleaned?", 'May tao sa litrato. Kunan ulit ang nilinis na lugar lang?'), evidence: {} };
  }

  // small vision models list scenes poorly but answer yes/no well, so each object is asked about in both photos;
  // there before and gone after is decided by code, not by the model
  const ask = async (name: string, uri: string) =>
    saidYes((await runAi('eyes', [{ role: 'user', content: `Is there a ${name} in this photo? Answer yes or no.` }], noop, uri, { maxTokens: 3, temperature: 0 })).text);
  const candidates = [...new Set([...mentionedObjects(before.text), ...COMMON_CLUTTER])].slice(0, 6);
  const removed: string[] = [];
  for (const name of candidates) {
    onStage(tr(`Tara is checking: ${name}...`, `Tinitingnan ni Tara: ${name}...`));
    if ((await ask(name, beforeUri)) && !(await ask(name, afterUri))) removed.push(name);
  }
  console.log(`[linis] before: ${before.text.replace(/\s+/g, ' ')} | after: ${after.text.replace(/\s+/g, ' ')} | removed: ${removed.join(', ') || 'none'}`);
  if (removed.length > 0) {
    const what = removed.join(tr(' and ', ' at '));
    return {
      verdict: 'patunay',
      said: tr(`The ${what} ${removed.length > 1 ? 'are' : 'is'} gone from the spot. Great job!`, `Wala na ang ${what} sa puwesto. Ang galing!`),
      evidence: { items_removed: removed.length },
    };
  }

  onStage(tr('Tara is comparing them...', 'Pinaghahambing ni Tara...'));
  const judged = await runAi('brain',
    [
      {
        role: 'system',
        content:
          'You are Tara, a kind tarsier who checks proof that a chore was done. You never judge the person, their home or how nice things look. Only decide if the After photo shows the task was done compared with Before.',
      },
      { role: 'user', content: `Task: ${task}\nBefore photo:\n${before.text}\n\nAfter photo:\n${after.text}\n\nCompare the two descriptions. Items that are gone, fewer, or put away in the After photo mean tidying happened. Was the task done? Set "done", and in "tara" write one short cheerful sentence naming what changed, like "The 2 cups are gone from the table!"` },
    ],
    noop,
    undefined,
    { maxTokens: 120, temperature: 0.2, responseFormat: { type: 'json_schema', json_schema: { strict: true, schema: VERDICT_SCHEMA } } },
  );

  let done = false;
  let line = '';
  try {
    const parsed: unknown = parseModelJson(judged.text, 'linis');
    if (parsed && typeof parsed === 'object' && 'done' in parsed && 'tara' in parsed) {
      done = parsed.done === true;
      line = typeof parsed.tara === 'string' ? parsed.tara.trim() : '';
    }
  } catch {
    done = false;
  }
  return done
    ? { verdict: 'patunay', said: line || tr('I can see the change. Great job!', 'Kita ko ang pagbabago. Ang galing!'), evidence: {} }
    : { verdict: 'not_confirmed', said: tr("I couldn't confirm it from the photos. The After photo looked about the same to me. A closer, brighter photo of the same spot helps.", 'Hindi ko makumpirma sa mga litrato. Parang pareho ang After photo. Makakatulong ang mas malapit at mas maliwanag na kuha.'), evidence: {} };
}
