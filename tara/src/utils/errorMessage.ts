/**
 * Readable text for anything thrown or rejected. Native modules often reject with plain objects,
 * which `String(err)` turns into "[object Object]".
 * @param err caught value
 */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    for (const key of ['message', 'error', 'reason'] as const) {
      const value = (err as Record<string, unknown>)[key];
      if (typeof value === 'string' && value) return value;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'unknown error object';
    }
  }
  return String(err);
}
