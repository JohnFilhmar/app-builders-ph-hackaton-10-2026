import { activeModel } from '@/lib/ai/activeModel';
import { runLlamaChat } from '@/lib/runtimes/llamaRuntime';
import type { CheckOutcome } from '@/types/quest';

const DESCRIBE = 'Describe this photo in one sentence. List the main objects you see and where they are.';
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
  onStage('Tara is looking at your Before photo...');
  const before = await runLlamaChat(eyes, [{ role: 'user', content: DESCRIBE }], noop, beforeUri, { maxTokens: 80 });
  onStage('Tara is looking at your After photo...');
  const after = await runLlamaChat(eyes, [{ role: 'user', content: DESCRIBE }], noop, afterUri, { maxTokens: 80 });

  if (PERSON.test(after.text) || PERSON.test(before.text)) {
    return { verdict: 'person', said: "There's a person in the photo. Retake just the spot you cleaned?", evidence: {} };
  }

  onStage('Tara is comparing them...');
  const brain = activeModel('brain');
  const judged = await runLlamaChat(
    brain,
    [
      {
        role: 'system',
        content:
          'You are Tara, a kind tarsier who checks proof that a chore was done. You never judge the person, their home or how nice things look. Only decide if the After photo shows the task was done compared with Before.',
      },
      { role: 'user', content: `Task: ${task}\nBefore photo: ${before.text}\nAfter photo: ${after.text}\nWas the task done? Set "done", and in "tara" write one short cheerful sentence naming what changed.` },
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
    ? { verdict: 'patunay', said: line || 'I can see the change. Great job!', evidence: {} }
    : { verdict: 'not_confirmed', said: `I couldn't confirm it from the photos. I saw: ${after.text}`, evidence: {} };
}
