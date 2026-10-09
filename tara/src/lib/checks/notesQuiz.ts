import { z } from 'zod';

import { activeModel } from '@/lib/ai/activeModel';
import { runLlamaChat } from '@/lib/runtimes/llamaRuntime';
import { quizQuestionSchema, type QuizQuestion } from '@/types/quest';

const noop = () => undefined;
const MIN_NOTE_WORDS = 12;

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

/**
 * Builds the Aral quiz from a photo of notes, ahead of time: the "eyes" model reads the page, the "brain" model writes
 * 5 multiple-choice questions constrained to a JSON schema. Runs when the study block starts, so the quiz is ready
 * before the timer ends. Returns null when the notes cannot be read; the quest then lands at Nakita.
 * @param notesUri notes photo (in-app camera)
 */
export async function prepareQuiz(notesUri: string): Promise<QuizQuestion[] | null> {
  const read = await runLlamaChat(
    activeModel('eyes'),
    [{ role: 'user', content: 'Read this page of notes and write out all of its text.' }],
    noop,
    notesUri,
    { maxTokens: 320, temperature: 0.1 },
  );
  const notes = read.text.trim();
  if (notes.split(/\s+/).length < MIN_NOTE_WORDS) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const out = await runLlamaChat(
      activeModel('brain'),
      [
        { role: 'system', content: 'You write short study quizzes. Use only facts from the notes. Each question has exactly 3 choices and one correct answer.' },
        { role: 'user', content: `Notes:\n${notes}\n\nWrite 5 multiple-choice questions about these notes.` },
      ],
      noop,
      undefined,
      { maxTokens: 700, temperature: 0.4, responseFormat: { type: 'json_schema', json_schema: { strict: true, schema: QUIZ_SCHEMA } } },
    );
    try {
      const parsed = quizSchema.safeParse(JSON.parse(out.text));
      if (parsed.success) return parsed.data.questions;
    } catch {
      // retry once with a fresh sample
    }
  }
  return null;
}
