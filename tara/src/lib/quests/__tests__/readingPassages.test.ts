import { cleanPassage } from '@/lib/quests/readingPassages';

jest.mock('@/lib/ai/runAi', () => ({ runAi: jest.fn() }));
jest.mock('@/lib/checks/notesQuiz', () => ({ readNotes: jest.fn() }));

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

describe('cleanPassage', () => {
  it('drops a lead-in line, markdown and wrapping quotes', () => {
    const { text } = cleanPassage(`Here is your passage:\n"**The carabao** works hard in the field. ${words(25)}."`);
    expect(text.startsWith('The carabao works hard')).toBe(true);
    expect(text).not.toMatch(/[*"]/);
  });

  it('refuses text too short to read aloud', () => {
    expect(() => cleanPassage('Too short.')).toThrow(/at least/);
  });

  it('cuts a long page at a sentence end', () => {
    const long = `${words(60)}. ${words(80)}.`;
    const { text } = cleanPassage(long);
    expect(text.endsWith('.')).toBe(true);
    expect(text.split(' ').length).toBeLessThanOrEqual(110);
  });

  it('tells Tagalog from English', () => {
    expect(cleanPassage('Ang kalabaw ay masipag na hayop sa bukid at tumutulong sa mga magsasaka sa pagtatanim ng palay tuwing tag-ulan sa probinsya ng aming lolo at lola.').lang).toBe('tl');
    expect(cleanPassage(`The water cycle moves water from the sea to the sky and back again. ${words(15)}`).lang).toBe('en');
  });
});
