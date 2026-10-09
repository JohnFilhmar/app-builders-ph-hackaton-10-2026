import { runAi } from '@/lib/ai/runAi';
import { checkBeforeAfter } from '@/lib/checks/beforeAfter';

jest.mock('@/lib/ai/runAi', () => ({ runAi: jest.fn() }));
jest.mock('@/lib/i18n/translate', () => ({ tr: (en: string) => en }));
const mockRunAi = jest.mocked(runAi);

const reply = (text: string) => ({ text });

describe('checkBeforeAfter', () => {
  beforeEach(() => mockRunAi.mockReset());

  it('never passes a quest when the eyes model saw nothing', async () => {
    mockRunAi.mockResolvedValue(reply(''));
    const outcome = await checkBeforeAfter('Clean desk', 'b.jpg', 'a.jpg', () => undefined);
    expect(outcome.verdict).toBe('not_confirmed');
    expect(outcome.said.trim()).not.toBe('');
    expect(mockRunAi.mock.calls.some(([capability]) => capability === 'brain')).toBe(false);
  });

  it('falls back to a real sentence when the judge writes a blank line', async () => {
    mockRunAi.mockImplementation(async (capability, messages) => {
      if (capability === 'brain') return reply('{"done": true, "tara": "  "}');
      return reply(messages[0]?.content.startsWith('Is there') ? 'no' : 'A desk with a book.');
    });
    const outcome = await checkBeforeAfter('Clean desk', 'b.jpg', 'a.jpg', () => undefined);
    expect(outcome.verdict).toBe('patunay');
    expect(outcome.said.trim()).not.toBe('');
  });
});
