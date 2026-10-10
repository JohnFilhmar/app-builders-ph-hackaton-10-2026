import { z } from 'zod';

import { runAi } from '@/lib/ai/runAi';
import { quizQuestionSchema, type QuizQuestion } from '@/types/quest';
import { parseModelJson } from '@/utils/parseModelJson';

const noop = () => undefined;

// the model names the right answer as text: small models asked for an answer index point at the wrong choice,
// so code shuffles the three answers and works out the index itself
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
          correct: { type: 'string' },
          wrong: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
        },
        required: ['question', 'correct', 'wrong'],
      },
    },
  },
  required: ['questions'],
} as const;

const modelQuizSchema = z.object({
  questions: z.array(z.object({ question: z.string(), correct: z.string(), wrong: z.array(z.string()).length(2) })).length(5),
});
const quizSchema = z.array(quizQuestionSchema).length(5);

// a captioning model (moondream) answers a page photo with a scene description instead of the page's text
const DESCRIPTION = /^\s*(the|this|a|an)\s+(image|photo|picture|screen|screenshot)\s+(shows|is|depicts|displays|contains|features)\b/i;

/** Three answers in random order and where the correct one landed; null when an answer repeats. */
function toQuestion(q: { question: string; correct: string; wrong: string[] }): QuizQuestion | null {
  const answers = [q.correct, ...q.wrong].map((a) => a.trim());
  if (new Set(answers.map((a) => a.toLowerCase())).size !== answers.length) return null;
  const order = [0, 1, 2].sort(() => Math.random() - 0.5);
  return { question: q.question.trim(), choices: order.map((i) => answers[i] ?? ''), answer: order.indexOf(0) };
}

/** Fewest words of notes that still make a fair 5-question quiz. */
export const MIN_NOTE_WORDS = 12;

/**
 * The "eyes" model reads a notes photo and writes out its text. Small vision models misread dense pages, so the
 * caller shows this text for the user to fix when it comes back short.
 * @param notesUri notes photo (in-app camera)
 */
export async function readNotes(notesUri: string): Promise<string> {
  const read = await runAi('eyes',
    // an instruction, not a question: moondream answers a question about a photo with nothing at all
    [{ role: 'user', content: 'Transcribe all the text in this image, line by line. Write only the text you see.' }],
    noop,
    notesUri,
    { maxTokens: 320, temperature: 0.1 },
  );
  const text = read.text.trim();
  console.log(`[aral] eyes read ${text.split(/\s+/).length} words: ${text.slice(0, 200)}`);
  if (DESCRIPTION.test(text)) {
    throw new Error('the photo model described the picture instead of reading its text. Pick a model that reads text (qwen3-vl) for photos in AI settings');
  }
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
        {
          role: 'system',
          content: 'You write short study quizzes. Use only facts from the notes. Keep each question under 15 words and each answer under 6 words. For each question give the correct answer and two wrong answers that look believable.',
        },
        { role: 'user', content: `Notes:
${notes.slice(0, 2400)}

Write 5 multiple-choice questions about these notes.` },
      ],
      (soFar) => onQuestion(Math.max(0, soFar.split('"question"').length - 1)),
      undefined,
      { maxTokens: 900, temperature: 0.4, responseFormat: { type: 'json_schema', json_schema: { strict: true, schema: QUIZ_SCHEMA } } },
    );
    try {
      const parsed = modelQuizSchema.safeParse(parseModelJson(out.text, 'aral'));
      if (!parsed.success) {
        console.warn(`[aral] quiz attempt ${attempt + 1} failed validation: ${parsed.error.message.slice(0, 200)}`);
        continue;
      }
      const quiz = quizSchema.safeParse(parsed.data.questions.map(toQuestion));
      if (quiz.success) return quiz.data;
      console.warn(`[aral] quiz attempt ${attempt + 1} repeated an answer`);
    } catch {
      console.warn(`[aral] quiz attempt ${attempt + 1} was not JSON: ${out.text.slice(-200)}`);
    }
  }
  return null;
}
