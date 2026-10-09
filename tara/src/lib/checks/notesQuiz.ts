import { z } from 'zod';

import { runAi } from '@/lib/ai/runAi';
import { quizQuestionSchema, type QuizQuestion } from '@/types/quest';
import { parseModelJson } from '@/utils/parseModelJson';

const noop = () => undefined;

const QUIZ_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          choices: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
          answer: { type: 'integer', minimum: 0, maximum: 2 },
        },
        required: ['question', 'choices', 'answer'],
      },
    },
  },
  required: ['questions'],
} as const;

const quizSchema = z.object({ questions: z.array(quizQuestionSchema).length(5) });

/** Fewest words of notes that still make a fair 5-question quiz. */
export const MIN_NOTE_WORDS = 12;

/**
 * The "eyes" model reads a notes photo and writes out its text. Small vision models misread dense pages, so the
 * caller shows this text for the user to fix when it comes back short.
 * @param notesUri notes photo (in-app camera)
 */
export async function readNotes(notesUri: string): Promise<string> {
  const read = await runAi('eyes',
    [{ role: 'user', content: 'What text is written on this page? Write out the words exactly, line by line.' }],
    noop,
    notesUri,
    { maxTokens: 320, temperature: 0.1 },
  );
  const text = read.text.trim();
  console.log(`[aral] eyes read ${text.split(/s+/).length} words: ${text.slice(0, 200)}`);
  return text;
}

/**
 * The "brain" model writes 5 multiple-choice questions from the notes, constrained to a JSON schema. Tries twice.
 * @param notes text of the notes, read from the photo or typed by the user
 * @param onQuestion called with how many questions are written so far, for the waiting screen
 */
export async function quizFromNotes(notes: string, onQuestion: (written: number) => void): Promise<QuizQuestion[] | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const out = await runAi('brain',
      [
        { role: 'system', content: 'You write short study quizzes. Use only facts from the notes. Keep each question under 15 words and each choice under 6 words. Exactly 3 choices, one correct.' },
        { role: 'user', content: `Notes:
${notes.slice(0, 2400)}

Write 5 multiple-choice questions about these notes.` },
      ],
      (soFar) => onQuestion(Math.max(0, soFar.split('"question"').length - 1)),
      undefined,
      { maxTokens: 900, temperature: 0.4, responseFormat: { type: 'json_schema', json_schema: { strict: true, schema: QUIZ_SCHEMA } } },
    );
    try {
      const parsed = quizSchema.safeParse(parseModelJson(out.text, 'aral'));
      if (parsed.success) return parsed.data.questions;
      console.warn(`[aral] quiz attempt ${attempt + 1} failed validation: ${parsed.error.message.slice(0, 200)}`);
    } catch {
      console.warn(`[aral] quiz attempt ${attempt + 1} was not JSON: ${out.text.slice(-200)}`);
    }
  }
  return null;
}
