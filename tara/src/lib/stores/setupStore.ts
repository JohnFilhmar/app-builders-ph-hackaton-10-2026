import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CapabilityId, TaraCatalog } from '@/types/catalog';
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
  setNanayMode: (isNanayMode: boolean) => void;
  setBaseAvatar: (baseAvatar: BaseAvatar) => void;
  hasHydrated: boolean;
  setBackendUrl: (url: string) => void;
  setCatalog: (catalog: TaraCatalog) => void;
  chooseTier: (capability: CapabilityId, tierId: string) => void;
  finishSetup: () => void;
};

/** First-launch setup: where models come from, which tier per capability, and whether setup finished. */
export const useSetupStore = create<SetupStore>()(
  persist(
    (set) => ({
      // the dev laptop over USB (adb reverse); change on the setup screen for Wi-Fi
      backendUrl: 'http://localhost:8787',
      catalog: null,
      chosenTiers: {},
      isSetupDone: false,
      baseAvatar: 'female',
      isNanayMode: false,
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
      partialize: (s) => ({ backendUrl: s.backendUrl, catalog: s.catalog, chosenTiers: s.chosenTiers, isSetupDone: s.isSetupDone, baseAvatar: s.baseAvatar, isNanayMode: s.isNanayMode }),
      onRehydrateStorage: () => () => useSetupStore.setState({ hasHydrated: true }),
    },
  ),
);
