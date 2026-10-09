import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { QuizQuestion } from '@/types/quest';

/** Per-quest working data that is not part of the ledger: photos, the prepared quiz, timers. */
export type QuestWork = {
  started_at?: number;
  before_uri?: string;
  notes_uri?: string;
  quiz_status?: 'generating' | 'ready' | 'failed';
  quiz?: QuizQuestion[];
  passage_id?: string;
  rep_target?: number;
  retake_used?: boolean;
};

type QuestStore = {
  work: Record<string, QuestWork>;
  patch: (questId: string, patch: Partial<QuestWork>) => void;
  clear: (questId: string) => void;
};

/** Working data per quest, persisted so a running quest survives the app closing. */
export const useQuestStore = create<QuestStore>()(
  persist(
    (set) => ({
      work: {},
      patch: (questId, patch) => set((s) => ({ work: { ...s.work, [questId]: { ...s.work[questId], ...patch } } })),
      clear: (questId) =>
        set((s) => {
          const work = { ...s.work };
          delete work[questId];
          return { work };
        }),
    }),
    { name: 'tara-quests', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
