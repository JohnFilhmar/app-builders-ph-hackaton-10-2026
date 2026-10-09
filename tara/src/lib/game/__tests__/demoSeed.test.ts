import { completeQuest } from '@/lib/game/completeQuest';
import { buildDemoEvents } from '@/lib/game/demoSeed';
import { deriveState } from '@/lib/game/deriveState';

const NOW = new Date(2026, 9, 20, 10, 0, 0).getTime();

describe('buildDemoEvents', () => {
  const demo = buildDemoEvents(NOW);

  it('starts 30 XP short of Masipag with no streak bonus and no comeback', () => {
    const s = deriveState(demo, NOW);
    expect(s.totalXp).toBe(370);
    expect(s.level.level).toBe(2);
    expect(s.streak.multiplier).toBe(1);
    expect(s.comebackDue).toBe(false);
  });

  it('levels up on the stage Linis quest, +45 at Patunay', () => {
    const stage = completeQuest(demo, { quest_id: 'linis_mesa', quest_type: 'linis', minutes: 15, tier: 'patunay', disputed: false }, NOW + 60_000);
    expect(stage.type === 'quest_completed' && stage.payload.xp).toBe(45);
    expect(deriveState([...demo, stage], NOW + 61_000).level.level).toBe(3);
  });

  it('still levels up when both stage quests fall back to 1x', () => {
    const f1 = completeQuest(demo, { quest_id: 'f1', quest_type: 'linis', minutes: 15, tier: 'patunay', disputed: true }, NOW + 60_000);
    const f2 = completeQuest([...demo, f1], { quest_id: 'f2', quest_type: 'aral', minutes: 20, tier: 'patunay', disputed: true }, NOW + 120_000);
    expect(deriveState([...demo, f1, f2], NOW + 121_000).level.level).toBe(3);
  });
});
