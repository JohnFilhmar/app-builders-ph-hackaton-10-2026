import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CapabilityId } from '@/types/catalog';

/** Where one AI job runs: the downloaded on-device model, an Ollama laptop on the LAN, or OpenRouter in the cloud. */
export type AiSource = { kind: 'device' } | { kind: 'lan'; base_url: string; model: string } | { kind: 'cloud'; model: string };
export type RemoteSource = Exclude<AiSource, { kind: 'device' }>;

type AiStore = {
  sources: Record<CapabilityId, AiSource>;
  /** laptop addresses used before, offered as one-tap chips */
  lan_servers: string[];
  setSource: (capability: CapabilityId, source: AiSource) => void;
  rememberServer: (url: string) => void;
};

const DEVICE: AiSource = { kind: 'device' };

/** Per-job AI source choices. On-device is the default and the fallback when a remote source fails. */
export const useAiStore = create<AiStore>()(
  persist(
    (set) => ({
      sources: { brain: DEVICE, eyes: DEVICE, ears: DEVICE },
      lan_servers: [],
      setSource: (capability, source) => set((s) => ({ sources: { ...s.sources, [capability]: source } })),
      rememberServer: (url) => set((s) => ({ lan_servers: [url, ...s.lan_servers.filter((u) => u !== url)].slice(0, 5) })),
    }),
    { name: 'tara-ai-sources', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** "192.168.1.5" or "http://192.168.1.5:11434/" -> "http://192.168.1.5:11434" (Ollama's default port when none is given). */
export function normalizeServer(input: string, defaultPort = 11434): string {
  let url = input.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(url)) url = `http://${url}`;
  if (!/:\d+$/.test(url.replace(/^https?:\/\//, ''))) url = `${url}:${defaultPort}`;
  return url;
}

const KEY_NAME = 'openrouter_api_key';

/** The OpenRouter key lives in the phone's secure storage (Android Keystore), never in plain app storage. */
export const cloudKey = {
  get: () => SecureStore.getItemAsync(KEY_NAME),
  set: (key: string) => (key.trim() ? SecureStore.setItemAsync(KEY_NAME, key.trim()) : SecureStore.deleteItemAsync(KEY_NAME)),
};

/** Where the AI runs overall, for the Home badge: Offline only when every job is on-device. */
export function aiReach(sources: Record<CapabilityId, AiSource>): 'offline' | 'lan' | 'cloud' {
  const kinds = Object.values(sources).map((s) => s.kind);
  if (kinds.includes('cloud')) return 'cloud';
  if (kinds.includes('lan')) return 'lan';
  return 'offline';
}
