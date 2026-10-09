import { completeQuest } from '@/lib/game/completeQuest';
import { deriveState } from '@/lib/game/deriveState';
import type { GameEvent } from '@/types/gameEvents';

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 20, 10, 0, 0).getTime();
const profile: GameEvent = { id: 'p', type: 'profile_created', at: NOW - 5 * DAY, payload: { base_avatar: 'male' } };

describe('deriveState', () => {
  it('turns a declared quest into XP, achievements and a streak once completed', () => {
    const declared: GameEvent = { id: 'd', type: 'quest_declared', at: NOW - 1000, payload: { quest_id: 'q1', title: 'Ayusin ang kama', quest_type: 'linis', planned_minutes: 10 } };
    const before = [profile, declared];
    expect(deriveState(before, NOW).openQuests).toHaveLength(1);
    const events = [...before, completeQuest(before, { quest_id: 'q1', quest_type: 'linis', minutes: 10, tier: 'patunay', disputed: false }, NOW)];
    const s = deriveState(events, NOW);
    expect(s.totalXp).toBe(30);
    expect(s.openQuests).toHaveLength(0);
    expect([...s.achievements].sort()).toEqual(['unang_hakbang', 'unang_patunay']);
    expect(s.streak.current).toBe(1);
  });

  it('lands a banked dispute the next morning, outside the caps', () => {
    const events: GameEvent[] = [profile];
    events.push(completeQuest(events, { quest_id: 'a', quest_type: 'sariling', minutes: 60, tier: 'sabi_ko', disputed: false }, NOW));
    events.push(completeQuest(events, { quest_id: 'b', quest_type: 'linis', minutes: 20, tier: 'patunay', disputed: true }, NOW + 1000));
    expect(deriveState(events, NOW + 2000).totalXp).toBe(60);
    const nextDay = deriveState(events, NOW + DAY);
    expect(nextDay.totalXp).toBe(80);
    expect(nextDay.today.questXp).toBe(0);
  });

  it('counts a quest finished after midnight on the day it finished', () => {
    const lateStart = new Date(2026, 9, 20, 23, 50).getTime();
    const afterMidnight = lateStart + 20 * 60_000;
    const events: GameEvent[] = [profile];
    events.push(completeQuest(events, { quest_id: 'm', quest_type: 'aral', minutes: 20, tier: 'nakita', disputed: false }, afterMidnight));
    expect(deriveState(events, afterMidnight + 1000).today.questXp).toBe(40);
  });

  it('flags a clock moved back and clears once time passes the latest event', () => {
    const events: GameEvent[] = [profile];
    events.push(completeQuest(events, { quest_id: 'c', quest_type: 'linis', minutes: 10, tier: 'sabi_ko', disputed: false }, NOW));
    expect(deriveState(events, NOW - 10 * 60_000).clockFlagged).toBe(true);
    expect(deriveState(events, NOW + 1).clockFlagged).toBe(false);
  });

  it('offers a comeback after 3 days away, once', () => {
    const events: GameEvent[] = [profile];
    events.push(completeQuest(events, { quest_id: 'c', quest_type: 'basa', minutes: 15, tier: 'nakita', disputed: false }, NOW - 4 * DAY));
    expect(deriveState(events, NOW).comebackDue).toBe(true);
    events.push({ id: 'cb', type: 'comeback_awarded', at: NOW, payload: { xp: 20 } });
    const s = deriveState(events, NOW);
    expect(s.comebackDue).toBe(false);
    expect(s.totalXp).toBe(50);
  });

  it('spends Pabuya from a separate balance without lowering XP', () => {
    const events: GameEvent[] = [profile];
    events.push(completeQuest(events, { quest_id: 'q', quest_type: 'linis', minutes: 10, tier: 'patunay', disputed: false }, NOW));
    events.push({ id: 'pc', type: 'pabuya_created', at: NOW + 1, payload: { pabuya_id: 'm', title: 'Milk tea', price: 20 } });
    events.push({ id: 'pk', type: 'pabuya_claimed', at: NOW + 2, payload: { pabuya_id: 'm' } });
    const s = deriveState(events, NOW + 3);
    expect(s.totalXp).toBe(30);
    expect(s.pabuyaBalance).toBe(10);
    expect(s.achievements).toContain('pabuya_natanggap');
  });

  it('charges for shop items once and refunds retired ones', () => {
    const events: GameEvent[] = [profile];
    events.push(completeQuest(events, { quest_id: 'r', quest_type: 'linis', minutes: 60, tier: 'patunay', disputed: false }, NOW));
    const before = deriveState(events, NOW + 1).pabuyaBalance;
    events.push({ id: 'b1', type: 'item_bought', at: NOW + 2, payload: { item_id: 'frame_kawayan', price: 120 } });
    events.push({ id: 'b2', type: 'item_bought', at: NOW + 3, payload: { item_id: 'frame_kawayan', price: 120 } });
    events.push({ id: 'b3', type: 'item_bought', at: NOW + 4, payload: { item_id: 'fit_barong', price: 350 } });
    const s = deriveState(events, NOW + 5);
    expect(s.pabuyaBalance).toBe(before - 120);
    expect(s.ownedItems).toEqual(['frame_kawayan']);
  });

  it('awards Perpekto only for a perfect quiz', () => {
    const events: GameEvent[] = [profile];
    events.push(completeQuest(events, { quest_id: 'x', quest_type: 'aral', minutes: 30, tier: 'patunay', disputed: false, evidence: { quiz_correct: 4, quiz_total: 5 } }, NOW));
    expect(deriveState(events, NOW).achievements).not.toContain('perpekto');
    events.push(completeQuest(events, { quest_id: 'y', quest_type: 'aral', minutes: 30, tier: 'patunay', disputed: false, evidence: { quiz_correct: 5, quiz_total: 5 } }, NOW + 1));
    expect(deriveState(events, NOW + 2).achievements).toContain('perpekto');
  });
});
