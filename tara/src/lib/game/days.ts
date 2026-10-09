const pad = (n: number) => String(n).padStart(2, '0');
const keyToUtc = (key: string): number => {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/**
 * The phone's local calendar day for a timestamp, as `YYYY-MM-DD`.
 * @param at epoch milliseconds
 */
export function dayKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Shifts a day key by whole days.
 * @param key `YYYY-MM-DD`
 * @param days positive or negative
 */
export function addDays(key: string, days: number): string {
  const d = new Date(keyToUtc(key) + days * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * Whole days from one key to another.
 * @param from earlier `YYYY-MM-DD`
 * @param to later `YYYY-MM-DD`
 */
export const daysBetween = (from: string, to: string): number => Math.round((keyToUtc(to) - keyToUtc(from)) / 86_400_000);
