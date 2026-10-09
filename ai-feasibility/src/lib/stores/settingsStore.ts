import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Task } from '@/types/catalog';

type SettingsState = {
  /** Node catalog backend, e.g. http://192.168.1.10:8787 */
  backendUrl: string;
  /** Optional OpenAI-compatible model server on a laptop (llama.cpp server or Ollama /v1). */
  lanUrl: string;
  lanModel: string;
  /** User overrides of the catalog defaults, per task. */
  activeModels: Partial<Record<Task, string>>;
  setBackendUrl: (backendUrl: string) => void;
  setLan: (lanUrl: string, lanModel: string) => void;
  setActiveModel: (task: Task, modelId: string) => void;
};

/** Persisted app settings shared by every tab. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // dev laptop's LAN IP on 2026-10-09; change it on the Models tab if DHCP moves it
      backendUrl: 'http://192.168.0.157:8787',
      lanUrl: '',
      lanModel: '',
      activeModels: {},
      setBackendUrl: (backendUrl) => set({ backendUrl: backendUrl.trim().replace(/\/+$/, '') }),
      setLan: (lanUrl, lanModel) => set({ lanUrl: lanUrl.trim().replace(/\/+$/, ''), lanModel: lanModel.trim() }),
      setActiveModel: (task, modelId) => set((s) => ({ activeModels: { ...s.activeModels, [task]: modelId } })),
    }),
    { name: 'settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
