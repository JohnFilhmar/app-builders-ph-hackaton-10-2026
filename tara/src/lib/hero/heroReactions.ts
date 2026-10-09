import { create } from 'zustand';

import type { HeroReaction } from '@/types/hero';

const PRIORITY: Record<HeroReaction, number> = { tap: 0, thinking: 1, happy: 2, error: 2, achievement: 3, quest_done: 4, level_up: 5 };

/** How long each reaction owns the hero. Thinking is held until cleared, capped so a hung model never freezes it. */
export const REACTION_MS: Record<HeroReaction, number> = { tap: 700, thinking: 30_000, happy: 900, error: 800, achievement: 1200, quest_done: 1400, level_up: 1600 };

/**
 * Whether an incoming reaction may take over the hero. A finished reaction always yields; a running one yields only
 * to a different reaction of equal or higher priority, so repeated taps and duplicate celebrations never stack.
 */
export function canReplace(current: HeroReaction | null, startedAt: number, incoming: HeroReaction, now: number): boolean {
  if (!current || now - startedAt >= REACTION_MS[current]) return true;
  return incoming !== current && PRIORITY[incoming] >= PRIORITY[current];
}

type HeroStore = {
  reaction: HeroReaction | null;
  startedAt: number;
  /** bumps on every accepted reaction, so the same reaction twice in a row still replays */
  nonce: number;
  play: (reaction: HeroReaction) => void;
  /** ends a held thinking reaction; anything else keeps playing */
  stopThinking: () => void;
};

/** The hero's current reaction, shared by every hero on screen. Gameplay code calls play(); heroes animate it. */
export const useHeroStore = create<HeroStore>()((set, get) => ({
  reaction: null,
  startedAt: 0,
  nonce: 0,
  play: (reaction) => {
    const { reaction: current, startedAt, nonce } = get();
    const now = Date.now();
    if (canReplace(current, startedAt, reaction, now)) set({ reaction, startedAt: now, nonce: nonce + 1 });
  },
  stopThinking: () => {
    if (get().reaction === 'thinking') set((s) => ({ reaction: null, nonce: s.nonce + 1 }));
  },
}));
