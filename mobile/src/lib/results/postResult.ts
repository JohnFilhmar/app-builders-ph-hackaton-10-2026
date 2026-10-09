import type { RunResult } from '@/types/results';

/**
 * Upserts one run into the backend results table. Never throws; returns false when the backend is unreachable.
 * @param backendUrl base URL of the Node catalog backend
 * @param run the run to store (the backend upserts by id)
 */
export async function postResult(backendUrl: string, run: RunResult): Promise<boolean> {
  try {
    const res = await fetch(`${backendUrl}/results`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(run),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
