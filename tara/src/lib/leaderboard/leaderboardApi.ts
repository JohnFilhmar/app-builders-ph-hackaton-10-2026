import { getUserId } from '@/lib/leaderboard/identity';
import { boardSchema, type Board, type BoardPeriod } from '@/types/leaderboard';
import type { GameEvent } from '@/types/gameEvents';

const CHUNK = 400;
const TIMEOUT_MS = 8000;

async function call(baseUrl: string, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'content-type': 'application/json', ...init.headers } });
  const body: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : `server said ${res.status}`;
    throw new Error(message);
  }
  return body;
}

/**
 * Joins the board under a username. The server lowercases it, checks it is clean and unique, and ties it to this
 * install's id for good.
 * @returns the username as the server stored it
 */
export async function joinBoard(baseUrl: string, username: string): Promise<string> {
  const user_id = await getUserId();
  const body = await call(baseUrl, '/lb/register', { method: 'POST', body: JSON.stringify({ user_id, username }) });
  return body && typeof body === 'object' && 'username' in body && typeof body.username === 'string' ? body.username : username.toLowerCase();
}

/**
 * Sends the whole ledger in chunks; the server skips events it already has and recomputes XP with the game rules.
 * Nothing is queued separately: the ledger is the queue, so a failed sync just sends everything again next time.
 */
export async function syncLedger(baseUrl: string, events: GameEvent[]): Promise<void> {
  const user_id = await getUserId();
  for (let i = 0; i < events.length; i += CHUNK) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1600)); // the server allows one upload per 1.5 s
    await call(baseUrl, '/lb/events', { method: 'POST', body: JSON.stringify({ user_id, events: events.slice(i, i + CHUNK) }) });
  }
}

/** The board for a period, with this player's own row. */
export async function fetchBoard(baseUrl: string, period: BoardPeriod): Promise<Board> {
  const user_id = await getUserId();
  return boardSchema.parse(await call(baseUrl, `/lb?period=${period}`, { headers: { 'x-user-id': user_id } }));
}
