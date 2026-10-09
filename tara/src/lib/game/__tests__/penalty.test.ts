import { abortPenalty, cancelCosts, isLate, isOverdue } from '@/lib/game/penalty';
import { levelForXp } from '@/lib/game/levels';

const at = (xp: number) => ({ totalXp: xp, level: levelForXp(xp) });

describe('abortPenalty', () => {
  it('never takes anything at level 1 with 0 Sipag', () => {
    expect(abortPenalty(at(0), 'cancelled')).toBe(0);
  });

  it('never drops below the level floor', () => {
    expect(abortPenalty(at(152), 'expired')).toBe(2);
    expect(abortPenalty(at(300), 'cancelled')).toBe(5);
  });
});

describe('timing', () => {
  const hour = 3_600_000;
  it('charges a cancel only for unscheduled or overdue plans', () => {
    expect(cancelCosts({}, 0)).toBe(true);
    expect(cancelCosts({ scheduled_at: 2 * hour }, hour)).toBe(false);
  });

  it('expires after 6 hours and flags late finishes', () => {
    expect(isOverdue({ declared_at: 0 }, 7 * hour)).toBe(true);
    expect(isOverdue({ declared_at: 0, scheduled_at: 5 * hour }, 7 * hour)).toBe(false);
    expect(isLate({ scheduled_at: 0, planned_minutes: 30 }, hour + 1)).toBe(true);
    expect(isLate({ scheduled_at: 0, planned_minutes: 30 }, 59 * 60_000)).toBe(false);
  });
});
