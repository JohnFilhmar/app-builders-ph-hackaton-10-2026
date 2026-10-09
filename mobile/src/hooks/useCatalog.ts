import { useQuery } from '@tanstack/react-query';

import { BUNDLED_CATALOG, fetchCatalog, type CatalogSource } from '@/lib/catalog/fetchCatalog';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import type { Catalog, CatalogModel, Task } from '@/types/catalog';

type UseCatalog = {
  catalog: Catalog;
  source: CatalogSource;
  error: string | null;
  isFetching: boolean;
  refetch: () => void;
};

/** The current model catalog: backend when reachable, bundled copy otherwise. */
export function useCatalog(): UseCatalog {
  const backendUrl = useSettingsStore((s) => s.backendUrl);
  const query = useQuery({
    queryKey: ['catalog', backendUrl],
    queryFn: () => fetchCatalog(backendUrl),
    staleTime: Infinity,
  });
  return {
    catalog: query.data?.catalog ?? BUNDLED_CATALOG,
    source: query.data?.source ?? 'bundled',
    error: query.data?.error ?? null,
    isFetching: query.isFetching,
    refetch: () => void query.refetch(),
  };
}

/**
 * The model currently assigned to a task: the user's pick if it still exists in the catalog, else the catalog default.
 * @param task task slot to resolve
 */
export function useActiveModel(task: Task): CatalogModel | undefined {
  const { catalog } = useCatalog();
  const override = useSettingsStore((s) => s.activeModels[task]);
  const byId = (id: string | undefined) => catalog.models.find((m) => m.id === id && m.tasks.includes(task));
  return byId(override) ?? byId(catalog.defaults[task]);
}
