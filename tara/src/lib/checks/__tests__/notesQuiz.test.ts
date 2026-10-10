import { runAi } from '@/lib/ai/runAi';
import { quizFromNotes, readNotes } from '@/lib/checks/notesQuiz';

jest.mock('@/lib/ai/runAi', () => ({ runAi: jest.fn() }));
const mockRunAi = jest.mocked(runAi);

const modelQuiz = (questions: { question: string; correct: string; wrong: string[] }[]) => ({ text: JSON.stringify({ questions }) });
const five = Array.from({ length: 5 }, (_, i) => ({ question: `Question number ${i}?`, correct: `right ${i}`, wrong: [`wrong a${i}`, `wrong b${i}`] }));

describe('quizFromNotes', () => {
  beforeEach(() => mockRunAi.mockReset());

  it('marks the answer the model said was correct, wherever the shuffle puts it', async () => {
    mockRunAi.mockResolvedValue(modelQuiz(five));
    const quiz = await quizFromNotes('notes', () => undefined);
    expect(quiz).toHaveLength(5);
    quiz?.forEach((q, i) => {
      expect(q.choices).toHaveLength(3);
      expect(q.choices[q.answer]).toBe(`right ${i}`);
    });
  });

  it('retries when a wrong answer repeats the correct one', async () => {
    const broken = five.map((q, i) => (i === 0 ? { ...q, wrong: [q.correct, 'other'] } : q));
    mockRunAi.mockResolvedValueOnce(modelQuiz(broken)).mockResolvedValueOnce(modelQuiz(five));
    expect(await quizFromNotes('notes', () => undefined)).toHaveLength(5);
    expect(mockRunAi).toHaveBeenCalledTimes(2);
  });
});

describe('readNotes', () => {
  beforeEach(() => mockRunAi.mockReset());

  it('refuses a description of the photo instead of its text', async () => {
    mockRunAi.mockResolvedValue({ text: 'The image shows a laptop screen displaying a math problem.' });
    await expect(readNotes('photo.jpg')).rejects.toThrow(/described the picture/);
  });

  it('returns the text it read', async () => {
    mockRunAi.mockResolvedValue({ text: 'Mathematics Quick Review Notes\n1. Basic Arithmetic' });
    await expect(readNotes('photo.jpg')).resolves.toContain('Basic Arithmetic');
  });
});
