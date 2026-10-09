import { levelForXp } from '@/lib/game/levels';

describe('levelForXp', () => {
  it('maps thresholds to levels', () => {
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(149).level).toBe(1);
    expect(levelForXp(150).level).toBe(2);
    expect(levelForXp(399).level).toBe(2);
    expect(levelForXp(400).level).toBe(3);
  });

  it('reports progress inside a level', () => {
    expect(levelForXp(275).progress).toBe(0.5);
  });

  it('keeps level 3 full and flags XP banked past it', () => {
    expect(levelForXp(400)).toEqual({ level: 3, name: 'Masipag', floorXp: 400, nextXp: null, progress: 1, pastCap: false });
    expect(levelForXp(520).pastCap).toBe(true);
  });
});
