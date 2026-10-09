import bundled from '@/lib/catalog/catalog.json';
import { catalogSchema, type Catalog } from '@/types/catalog';
import { errorMessage } from '@/utils/errorMessage';

export type CatalogSource = 'backend' | 'bundled';

export const BUNDLED_CATALOG: Catalog = catalogSchema.parse(bundled);

/**
 * Loads the model catalog from the backend, falling back to the copy bundled at build time.
 * The fallback keeps the app usable offline and when the laptop backend is down.
 * @param backendUrl base URL of the Node catalog backend
 */
export async function fetchCatalog(backendUrl: string): Promise<{ catalog: Catalog; source: CatalogSource; error: string | null }> {
  try {
    const res = await fetch(`${backendUrl}/catalog`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = catalogSchema.safeParse(await res.json());
    if (!parsed.success) throw new Error(`invalid catalog: ${parsed.error.issues[0]?.message ?? 'unknown'}`);
    return { catalog: parsed.data, source: 'backend', error: null };
  } catch (err) {
    return { catalog: BUNDLED_CATALOG, source: 'bundled', error: errorMessage(err) };
  }
}
