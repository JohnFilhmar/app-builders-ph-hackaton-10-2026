import { cleanTitle, splitTasks } from '@/lib/chat/splitTasks';

describe('splitTasks', () => {
  it('keeps one task whole and strips the day', () => {
    expect(splitTasks('I am going to the gym tomorrow')).toEqual(['The gym']);
  });

  it('splits on and, commas and Tagalog joiners, but not "at 7pm"', () => {
    expect(splitTasks('clean my room and study math tomorrow at 7pm')).toEqual(['Clean my room', 'Study math']);
    expect(splitTasks('maglaba, magluto tapos mag-aral bukas')).toEqual(['Maglaba', 'Magluto', 'Mag-aral']);
  });
});

describe('cleanTitle', () => {
  it('drops the clock time', () => {
    expect(cleanTitle("I'm going to jog at 6:30 am")).toBe('Jog');
  });
});
