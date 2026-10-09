import { addDays, dayKey } from '@/lib/game/days';
import { walkStreak } from '@/lib/game/streak';

const NOW = new Date(2026, 9, 20, 10, 0, 0).getTime();
const today = dayKey(NOW);
const lv1 = () => 1;
const lv3 = () => 3;
/** n consecutive active days ending `endOffset` days before today */
const run = (n: number, endOffset = 0) => new Set(Array.from({ length: n }, (_, i) => addDays(today, -i - endOffset)));

describe('days', () => {
  it('crosses month and leap boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('walkStreak', () => {
  it('uses days before today for the multiplier', () => {
    const s = walkStreak(run(9, 1), today, lv1, false);
    expect(s.beforeToday).toBe(9);
    expect(s.multiplier).toBe(1.45);
  });

  it('caps the multiplier at 1.5', () => {
    expect(walkStreak(run(12, 1), today, lv1, false).multiplier).toBe(1.5);
  });

  it('drops the multiplier to 1 while the clock flag is on', () => {
    expect(walkStreak(run(9, 1), today, lv1, true).multiplier).toBe(1);
  });

  it('breaks on a missed day below level 3', () => {
    expect(walkStreak(run(7, 2), today, lv1, false).beforeToday).toBe(0);
  });

  it('spends a Baon Day on a missed day at level 3', () => {
    const s = walkStreak(run(7, 2), today, lv3, false);
    expect(s.beforeToday).toBe(7);
    expect(s.baonUsedOn).toEqual([addDays(today, -1)]);
  });

  it('counts today once a quest is done', () => {
    expect(walkStreak(run(3), today, lv1, false).current).toBe(3);
  });
});
