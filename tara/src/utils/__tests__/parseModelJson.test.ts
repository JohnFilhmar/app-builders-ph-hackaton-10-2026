import { parseModelJson } from '@/utils/parseModelJson';

describe('parseModelJson', () => {
  it('reads JSON wrapped in template tokens or prose', () => {
    expect(parseModelJson('<start_of_turn>model\n{"done": true}<end_of_turn>', 't')).toEqual({ done: true });
    expect(parseModelJson('{"a":1}', 't')).toEqual({ a: 1 });
  });

  it('returns null when there is no JSON', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(parseModelJson('<end_of_turn>', 't')).toBeNull();
    warn.mockRestore();
  });
});
