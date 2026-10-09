import { useSetupStore } from '@/lib/stores/setupStore';
import type { CapabilityId, CatalogModel } from '@/types/catalog';

/**
 * The tier the player chose for a capability during setup, as the model the runtimes load.
 * Throws when setup has not picked one, which the screens prevent by gating on setup.
 * @param capability brain, eyes or ears
 */
export function activeModel(capability: CapabilityId): CatalogModel {
  const { catalog, chosenTiers } = useSetupStore.getState();
  const tier = catalog?.capabilities.find((c) => c.id === capability)?.tiers.find((t) => t.id === chosenTiers[capability]);
  if (!tier) throw new Error(`No ${capability} model set up yet`);
  return tier;
}
