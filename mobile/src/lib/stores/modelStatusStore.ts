import { create } from 'zustand';

export type ModelState = 'unknown' | 'missing' | 'downloading' | 'verifying' | 'ready' | 'error';

export type ModelStatus = {
  state: ModelState;
  /** 0..1 while downloading */
  progress: number;
  error: string | null;
};

type ModelStatusStore = {
  statuses: Record<string, ModelStatus>;
  setStatus: (modelId: string, patch: Partial<ModelStatus>) => void;
};

const EMPTY: ModelStatus = { state: 'unknown', progress: 0, error: null };

/** Download and verification state per catalog model. Not persisted; files on disk are the truth. */
export const useModelStatusStore = create<ModelStatusStore>((set) => ({
  statuses: {},
  setStatus: (modelId, patch) =>
    set((s) => ({ statuses: { ...s.statuses, [modelId]: { ...(s.statuses[modelId] ?? EMPTY), ...patch } } })),
}));

/**
 * Reads one model's status, defaulting to `unknown` before the disk check runs.
 * @param modelId catalog model id
 */
export function useModelStatus(modelId: string | undefined): ModelStatus {
  return useModelStatusStore((s) => (modelId ? (s.statuses[modelId] ?? EMPTY) : EMPTY));
}
