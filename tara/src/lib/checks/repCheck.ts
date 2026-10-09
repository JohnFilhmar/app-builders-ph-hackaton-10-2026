import { runAi } from '@/lib/ai/runAi';
import { countingRuns, numberSequence } from '@/lib/checks/scoring';
import { tr } from '@/lib/i18n/translate';
import type { CheckOutcome } from '@/types/quest';
import { parseModelJson } from '@/utils/parseModelJson';

const REPS_SCHEMA = {
  type: 'object',
  properties: {
    warmup_runs: { type: 'integer', minimum: 0 },
    reps: { type: 'integer', minimum: 0 },
    tara: { type: 'string' },
  },
  required: ['warmup_runs', 'reps', 'tara'],
} as const;

/**
 * Tara's Ehersisyo check. The transcript is turned into counting runs (1-4, 1-4, 1-8, 8-1) without AI, then the
 * "brain" model decides which runs were warm-up and how many real reps the exercise had. Reps are capped by how many
 * numbers were actually heard, so the model can never award more than was counted.
 * @param exercise the quest title, e.g. "Jumping jacks"
 * @param target reps the user aimed for
 * @param transcript everything heard while the button was held
 */
export async function checkReps(exercise: string, target: number, transcript: string): Promise<CheckOutcome> {
  const seq = numberSequence(transcript);
  const runs = countingRuns(seq).filter((r) => r.length >= 2);
  if (runs.length === 0) return { verdict: 'not_confirmed', said: tr("I didn't catch any counting. Try again, a bit louder?", 'Wala akong narinig na bilang. Subukan ulit, mas malakas?'), evidence: { reps: 0, rep_target: target } };

  const runText = runs.map((r) => `${r.from} to ${r.to}`).join(', ');
  const judged = await runAi('brain',
    [
      {
        role: 'system',
        content:
          'You are Tara, a kind exercise buddy. You get the counting a person said aloud, split into runs. Rules: short counts at the start that repeat (like 1 to 4, 1 to 4) are a warm-up or a cadence call and are not reps. A count up then back down (like 1 to 8, then 8 to 1) is ONE rep of an 8-count exercise. For exercises like push-ups or squats counted 1 to 10, each number in the main set is one rep.',
      },
      { role: 'user', content: `Exercise: ${exercise}\nCounting runs heard, in order: ${runText}\nHow many runs were warm-up, and how many real reps were done? In "tara" write one short cheerful sentence.` },
    ],
    () => undefined,
    undefined,
    { maxTokens: 100, temperature: 0.1, responseFormat: { type: 'json_schema', json_schema: { strict: true, schema: REPS_SCHEMA } } },
  );

  let reps = 0;
  let line = '';
  try {
    const parsed: unknown = parseModelJson(judged.text, 'ehersisyo');
    if (parsed && typeof parsed === 'object' && 'reps' in parsed && typeof parsed.reps === 'number') {
      reps = Math.min(Math.max(0, Math.round(parsed.reps)), seq.length);
      line = 'tara' in parsed && typeof parsed.tara === 'string' ? parsed.tara : '';
    }
  } catch {
    console.warn(`[ehersisyo] judge was not JSON: ${judged.text.slice(0, 200)}`);
  }
  console.log(`[ehersisyo] runs ${runText} -> ${reps} reps`);

  const evidence = { reps, rep_target: target };
  if (reps >= target) return { verdict: 'patunay', said: `${reps} reps! ${line || tr('So strong!', 'Ang lakas mo!')}`, evidence };
  if (reps > 0) return { verdict: 'nakita', said: tr(`I counted ${reps} of ${target} real reps (heard: ${runText}). Seen (2x)!`, `${reps} sa ${target} na totoong reps ang nabilang ko (narinig: ${runText}). Nakita (2x)!`), evidence };
  return { verdict: 'not_confirmed', said: tr(`I heard ${runText}, but it sounded like warm-up only. Try the full set?`, `Narinig ko ang ${runText}, pero parang warm-up lang. Subukan ang buong set?`), evidence };
}
