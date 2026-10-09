import { create } from 'zustand';

import { postResult } from '@/lib/results/postResult';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { RunResult } from '@/types/results';

type ResultsState = {
  runs: RunResult[];
  /** ids that failed to reach the backend */
  unsynced: string[];
  addRun: (run: RunResult) => void;
  setScore: (id: string, score: number) => void;
  resync: () => Promise<void>;
};

async function sync(run: RunResult): Promise<boolean> {
  return postResult(useSettingsStore.getState().backendUrl, run);
}

/** Benchmark runs from this session, mirrored to the backend results table. */
export const useResultsStore = create<ResultsState>((set, get) => ({
  runs: [],
  unsynced: [],
  addRun: (run) => {
    set((s) => ({ runs: [run, ...s.runs].slice(0, 200) }));
    void sync(run).then((ok) => {
      if (!ok) set((s) => ({ unsynced: [...new Set([...s.unsynced, run.id])] }));
    });
  },
  setScore: (id, score) => {
    const run = get().runs.find((r) => r.id === id);
    if (!run) return;
    const updated = { ...run, score };
    set((s) => ({ runs: s.runs.map((r) => (r.id === id ? updated : r)) }));
    void sync(updated).then((ok) => {
      if (!ok) set((s) => ({ unsynced: [...new Set([...s.unsynced, id])] }));
    });
  },
  resync: async () => {
    const pending = get().runs.filter((r) => get().unsynced.includes(r.id));
    const results = await Promise.all(pending.map(async (r) => ((await sync(r)) ? null : r.id)));
    set({ unsynced: results.filter((id): id is string => id !== null) });
  },
}));
