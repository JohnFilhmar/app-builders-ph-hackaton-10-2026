import { create } from 'zustand';

type ThoughtStore = {
  /** the reasoning a thinking model has streamed so far for the job running now; empty when none */
  text: string;
  /** the reasoning of the job that just finished, so an answer can keep its thoughts */
  last: string;
  set: (text: string) => void;
  /** ends the live thoughts and keeps them as `last` */
  clear: () => void;
};

/** Tara's live thoughts: what a thinking model is reasoning before it answers, shown while a job runs. */
export const useThoughtStore = create<ThoughtStore>()((set) => ({
  text: '',
  last: '',
  set: (text) => set({ text }),
  clear: () => set((s) => ({ text: '', last: s.text })),
}));
