import { atTime, parseWhen, usualTime } from '@/lib/quests/schedule';
import type { GameEvent } from '@/types/gameEvents';

describe('parseWhen', () => {
  it('reads day and time', () => {
    expect(parseWhen('I am going to the gym tomorrow at 7pm')).toEqual({ day: 'tomorrow', time: { hour: 19, minute: 0 } });
    expect(parseWhen('bukas alas 6 ng umaga mag-jogging')).toEqual({ day: 'tomorrow', time: { hour: 6, minute: 0 } });
    expect(parseWhen('review notes today 18:30')).toEqual({ day: 'today', time: { hour: 18, minute: 30 } });
  });

  it('never reads a duration as a time', () => {
    expect(parseWhen('clean my room for 30 mins tomorrow')).toEqual({ day: 'tomorrow' });
    expect(parseWhen('I am going to the gym tomorrow')).toEqual({ day: 'tomorrow' });
  });
});

describe('atTime', () => {
  const now = new Date(2026, 9, 10, 20, 0).getTime();
  it('places tomorrow and rolls a past time forward', () => {
    expect(new Date(atTime('tomorrow', { hour: 7, minute: 0 }, now)).getDate()).toBe(11);
    expect(new Date(atTime(undefined, { hour: 7, minute: 0 }, now)).getDate()).toBe(11);
    expect(new Date(atTime(undefined, { hour: 21, minute: 0 }, now)).getDate()).toBe(10);
  });
});

describe('usualTime', () => {
  it('remembers the last scheduled time for the same quest type', () => {
    const at = new Date(2026, 9, 9, 6, 30).getTime();
    const events: GameEvent[] = [
      { id: 'e1', type: 'quest_declared', at: 1, payload: { quest_id: 'q1', title: 'Gym', quest_type: 'ehersisyo', planned_minutes: 30, scheduled_at: at } },
    ];
    expect(usualTime(events, 'ehersisyo')).toEqual({ hour: 6, minute: 30 });
    expect(usualTime(events, 'aral')).toBeNull();
  });
});
