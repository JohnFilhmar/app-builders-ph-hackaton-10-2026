import { canReplace, REACTION_MS, useHeroStore } from '@/lib/hero/heroReactions';

describe('canReplace', () => {
  it('lets anything start on an idle hero', () => {
    expect(canReplace(null, 0, 'tap', 0)).toBe(true);
  });

  it('ignores repeated taps and duplicate celebrations while one plays', () => {
    expect(canReplace('tap', 0, 'tap', 100)).toBe(false);
    expect(canReplace('quest_done', 0, 'quest_done', 100)).toBe(false);
  });

  it('lets a bigger reaction cut in but never a smaller one', () => {
    expect(canReplace('thinking', 0, 'happy', 100)).toBe(true);
    expect(canReplace('quest_done', 0, 'level_up', 100)).toBe(true);
    expect(canReplace('level_up', 0, 'achievement', 100)).toBe(false);
  });

  it('frees the hero once a reaction has finished', () => {
    expect(canReplace('level_up', 0, 'tap', REACTION_MS.level_up)).toBe(true);
  });
});

describe('useHeroStore', () => {
  it('holds thinking until stopped, and stopThinking leaves other reactions alone', () => {
    useHeroStore.getState().play('thinking');
    expect(useHeroStore.getState().reaction).toBe('thinking');
    useHeroStore.getState().stopThinking();
    expect(useHeroStore.getState().reaction).toBeNull();
    useHeroStore.getState().play('happy');
    useHeroStore.getState().stopThinking();
    expect(useHeroStore.getState().reaction).toBe('happy');
  });
});
