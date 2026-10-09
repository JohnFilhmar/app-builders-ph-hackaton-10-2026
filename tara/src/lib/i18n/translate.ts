import { useCallback } from 'react';

import { useSetupStore } from '@/lib/stores/setupStore';

/** Picks the English or Tagalog copy for the current app language. */
export type Translate = (en: string, tl: string) => string;

/**
 * App copy for the chosen language, as a hook so screens re-render when the language changes.
 * Copy sits inline at each call site as an (English, Tagalog) pair.
 */
export function useT(): Translate {
  const language = useSetupStore((s) => s.language);
  return useCallback((en, tl) => (language === 'tl' ? tl : en), [language]);
}

/** Same as useT, for code outside components (proof checks, notifications). */
export const tr: Translate = (en, tl) => (useSetupStore.getState().language === 'tl' ? tl : en);
