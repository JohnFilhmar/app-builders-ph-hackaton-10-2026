import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CapabilityId, TaraCatalog } from '@/types/catalog';
import type { Lang } from '@/types/chat';
import type { BaseAvatar } from '@/types/gameEvents';

type SetupStore = {
  /** team server that serves /tara/catalog; model specifics live only there */
  backendUrl: string;
  /** last catalog fetched from the server, kept so the app runs offline after setup */
  catalog: TaraCatalog | null;
  chosenTiers: Partial<Record<CapabilityId, string>>;
  isSetupDone: boolean;
  baseAvatar: BaseAvatar;
  isNanayMode: boolean;
  /** app copy language; AI output stays English first either way */
  language: Lang;
  hasChosenLanguage: boolean;
  heroName: string;
  setHeroName: (heroName: string) => void;
  setLanguage: (language: Lang) => void;
  setNanayMode: (isNanayMode: boolean) => void;
  setBaseAvatar: (baseAvatar: BaseAvatar) => void;
  hasHydrated: boolean;
  setBackendUrl: (url: string) => void;
  setCatalog: (catalog: TaraCatalog) => void;
  chooseTier: (capability: CapabilityId, tierId: string) => void;
  finishSetup: () => void;
};

/** The hosted team server (backend/ in Docker behind nginx). A laptop can still be typed in on the setup screen. */
export const DEFAULT_BACKEND_URL = 'https://tara.filhmar.online';
// the old default: the dev laptop over USB (adb reverse)
const OLD_DEFAULT_BACKEND_URL = 'http://localhost:8787';

/** First-launch setup: where models come from, which tier per capability, and whether setup finished. */
export const useSetupStore = create<SetupStore>()(
  persist(
    (set) => ({
      backendUrl: DEFAULT_BACKEND_URL,
      catalog: null,
      chosenTiers: {},
      isSetupDone: false,
      baseAvatar: 'female',
      isNanayMode: false,
      language: 'en',
      hasChosenLanguage: false,
      heroName: '',
      setHeroName: (heroName) => set({ heroName: heroName.trim().slice(0, 24) }),
      setLanguage: (language) => set({ language, hasChosenLanguage: true }),
      setNanayMode: (isNanayMode) => set({ isNanayMode }),
      setBaseAvatar: (baseAvatar) => set({ baseAvatar }),
      hasHydrated: false,
      setBackendUrl: (url) => set({ backendUrl: url.trim().replace(/\/+$/, '') }),
      setCatalog: (catalog) =>
        set((s) => {
          const chosenTiers = { ...s.chosenTiers };
          for (const cap of catalog.capabilities) {
            if (!chosenTiers[cap.id] || !cap.tiers.some((t) => t.id === chosenTiers[cap.id])) {
              chosenTiers[cap.id] = (cap.tiers.find((t) => t.recommended) ?? cap.tiers[0])?.id;
            }
          }
          return { catalog, chosenTiers };
        }),
      chooseTier: (capability, tierId) => set((s) => ({ chosenTiers: { ...s.chosenTiers, [capability]: tierId } })),
      finishSetup: () => set({ isSetupDone: true }),
    }),
    {
      name: 'tara-setup',
      storage: createJSONStorage(() => AsyncStorage),
      // v1: installs still on the old localhost default move to the hosted server; a custom address is kept
      version: 1,
      migrate: (persisted, version) => {
        if (version < 1 && persisted && typeof persisted === 'object' && 'backendUrl' in persisted && persisted.backendUrl === OLD_DEFAULT_BACKEND_URL) {
          return { ...persisted, backendUrl: DEFAULT_BACKEND_URL };
        }
        return persisted;
      },
      partialize: (s) => ({ backendUrl: s.backendUrl, catalog: s.catalog, chosenTiers: s.chosenTiers, isSetupDone: s.isSetupDone, baseAvatar: s.baseAvatar, isNanayMode: s.isNanayMode, language: s.language, hasChosenLanguage: s.hasChosenLanguage, heroName: s.heroName }),
      onRehydrateStorage: () => () => useSetupStore.setState({ hasHydrated: true }),
    },
  ),
);
