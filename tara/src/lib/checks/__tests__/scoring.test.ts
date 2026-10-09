import { highestCount, scoreReading } from '@/lib/checks/scoring';

describe('scoreReading', () => {
  it('scores a fully read passage at 1', () => {
    expect(scoreReading('The jeepney leaves every fifteen minutes.', 'the jeepney leaves every fifteen minutes').ratio).toBe(1);
  });

  it('forgives a one-letter misspelling from the speech model', () => {
    expect(scoreReading('Aalis ang jeep papuntang Quiapo', 'aalis ang jeep papuntang kiapo').matched).toBe(5);
  });

  it('lists skipped words', () => {
    const s = scoreReading('Please call the barangay hall before noon', 'please call the hall before noon');
    expect(s.skipped).toEqual(['barangay']);
    expect(s.ratio).toBeCloseTo(6 / 7);
  });
});

describe('highestCount', () => {
  it('reads English words and digits', () => {
    expect(highestCount('one two three four five')).toBe(5);
    expect(highestCount('18, 19, 20')).toBe(20);
    expect(highestCount('twenty one twenty two')).toBe(22);
  });

  it('reads Tagalog counting', () => {
    expect(highestCount('isa dalawa tatlo apat lima')).toBe(5);
    expect(highestCount('siyam sampu labing-isa labindalawa')).toBe(12);
    expect(highestCount("dalawampu't isa")).toBe(21);
  });

  it('returns 0 when nothing was counted', () => {
    expect(highestCount('uhm okay')).toBe(0);
  });
});
