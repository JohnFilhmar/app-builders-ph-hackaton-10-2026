import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { deriveState, type GameState } from '@/lib/game/deriveState';
import type { GameEvent } from '@/types/gameEvents';

type GameStore = {
  events: GameEvent[];
  state: GameState;
  /** last level the player was shown, so the level-up overlay plays once */
  seenLevel: number;
  append: (event: GameEvent) => void;
  replaceAll: (events: GameEvent[]) => void;
  /** re-derive against the current time (new day, clock changes) */
  refresh: () => void;
  markLevelSeen: (level: number) => void;
};

/** The ledger (append-only events) and its derived state. State is recomputed on write, never on render. */
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      events: [],
      state: deriveState([], Date.now()),
      seenLevel: 1,
      append: (event) => {
        const events = [...get().events, event];
        set({ events, state: deriveState(events, Date.now()) });
      },
      replaceAll: (events) => set({ events, state: deriveState(events, Date.now()), seenLevel: deriveState(events, Date.now()).level.level }),
      refresh: () => set({ state: deriveState(get().events, Date.now()) }),
      markLevelSeen: (seenLevel) => set({ seenLevel }),
    }),
    {
      name: 'tara-ledger',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ events: s.events, seenLevel: s.seenLevel }),
      onRehydrateStorage: () => (s) => s?.refresh(),
    },
  ),
);
