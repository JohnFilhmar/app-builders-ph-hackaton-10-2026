import { splitSse } from '@/utils/sse';

describe('splitSse', () => {
  it('parses complete data lines and keeps the unfinished tail', () => {
    const { events, rest } = splitSse('data: {"a":1}\n\ndata: {"b":2}\ndata: {"c"');
    expect(events).toEqual([{ a: 1 }, { b: 2 }]);
    expect(rest).toBe('data: {"c"');
  });

  it('finishes a line split across two chunks', () => {
    const first = splitSse('data: {"x":');
    const second = splitSse(`${first.rest}"y"}\n`);
    expect(first.events).toEqual([]);
    expect(second.events).toEqual([{ x: 'y' }]);
  });

  it('skips DONE, comments and junk', () => {
    expect(splitSse(': ping\ndata: [DONE]\ndata: not json\n').events).toEqual([]);
  });
});
