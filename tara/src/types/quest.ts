import { z } from 'zod';

import type { ProofTier, QuestType } from '@/types/gameEvents';

export const quizQuestionSchema = z.object({
  question: z.string().min(3),
  choices: z.array(z.string().min(1)).length(3),
  answer: z.number().int().min(0).max(2),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

/** Result of a proof check. `not_confirmed` offers retake or "Ginawa ko talaga"; `person` asks for a retake. */
export type CheckOutcome = {
  verdict: ProofTier | 'not_confirmed' | 'person';
  /** Tara's line, Taglish */
  said: string;
  evidence: Record<string, number>;
};

export type QuestTypeInfo = {
  type: QuestType;
  label: string;
  english: string;
  defaultMinutes: number;
  proofHint: string;
};
