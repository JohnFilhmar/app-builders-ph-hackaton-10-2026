import { computeAward, emptyTally } from '@/lib/game/xp';

const base = { questType: 'linis' as const, minutes: 15, tier: 'patunay' as const, disputed: false, streakMultiplier: 1, today: emptyTally() };

describe('computeAward', () => {
  it('multiplies minutes by tier and streak', () => {
    expect(computeAward(base)).toEqual({ tier: 'patunay', xp: 45, banked: 0, capped: null });
    expect(computeAward({ ...base, streakMultiplier: 1.45 }).xp).toBe(65);
  });

  it('clamps minutes to 10..60', () => {
    expect(computeAward({ ...base, minutes: 3 }).xp).toBe(30);
    expect(computeAward({ ...base, minutes: 90 }).xp).toBe(180);
  });

  it('caps Sabi Ko at 60 a day', () => {
    expect(computeAward({ ...base, tier: 'sabi_ko', minutes: 50, today: { ...emptyTally(), sabiKoXp: 30 } })).toEqual({
      tier: 'sabi_ko',
      xp: 30,
      banked: 0,
      capped: 'sabi_ko_cap',
    });
  });

  it('banks a dispute the cap blocks instead of paying zero', () => {
    expect(computeAward({ ...base, disputed: true, minutes: 20, today: { ...emptyTally(), sabiKoXp: 60 } })).toEqual({
      tier: 'sabi_ko',
      xp: 0,
      banked: 20,
      capped: 'sabi_ko_cap',
    });
  });

  it('caps quest XP at 300 a day', () => {
    expect(computeAward({ ...base, minutes: 60, today: { ...emptyTally(), questXp: 250 } })).toEqual({ tier: 'patunay', xp: 50, banked: 0, capped: 'daily_cap' });
  });

  it('gives nothing past 3 quests of one type, even when disputed', () => {
    const today = { ...emptyTally(), countByType: { ...emptyTally().countByType, linis: 3 } };
    expect(computeAward({ ...base, today })).toEqual({ tier: 'patunay', xp: 0, banked: 0, capped: 'repeat_limit' });
    expect(computeAward({ ...base, disputed: true, today }).xp).toBe(0);
  });
});
