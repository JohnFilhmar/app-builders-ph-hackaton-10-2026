// Leaderboard: players join with a username, phones upload their ledger, and the server ranks them by XP it
// recomputes with the app's own rules (tara/src/lib/game), so a phone can never just post a number.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { completeQuest } from '@/lib/game/completeQuest';
import { deriveState } from '@/lib/game/deriveState';
import { gameEventSchema, type GameEvent } from '@/types/gameEvents';

type Player = { username: string; created_at: number; events: GameEvent[] };
type Board = { players: Record<string, Player> };
export type BoardRow = { rank: number; username: string; xp: number; level: number };
export type Reply = { status: number; body: unknown };

const WEEK_MS = 7 * 86_400_000;
const MAX_BATCH = 500;
const MAX_EVENTS = 20_000;
const MIN_POST_GAP_MS = 1500;
export const USERNAME_RE = /^[a-z0-9_]{3,16}$/;
// ponytail: substring blocklist, English and Filipino; swap for a real moderation pass if the board goes public
const BLOCKED = ['fuck', 'shit', 'bitch', 'puta', 'tangina', 'gago', 'ulol', 'bobo', 'tanga', 'kantot', 'pakyu', 'sex', 'porn', 'nigg', 'admin', 'tara_official'];

/** True when a username is allowed: 3 to 16 of a-z, 0-9 and _, with no blocked word inside. */
export const isCleanUsername = (name: string) => USERNAME_RE.test(name) && !BLOCKED.some((w) => name.includes(w));

/**
 * Replays the ledger and lowers any finished quest's XP to what the app's rules allowed at that moment. Stored XP may
 * be lower (late finishes earn less), never higher. Forged quests can still be added, but only up to the same daily
 * caps a real player hits. Returns the corrected ledger and how many quests were lowered.
 */
export function clampToRules(events: GameEvent[]): { events: GameEvent[]; clamped: number } {
  const sorted = [...events].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  const out: GameEvent[] = [];
  let clamped = 0;
  // ponytail: replays from scratch per completion, O(n^2); fine for hundreds of events, cache state if ledgers grow
  for (const e of sorted) {
    if (e.type !== 'quest_completed') {
      out.push(e);
      continue;
    }
    const p = e.payload;
    const expected = completeQuest(out, { quest_id: p.quest_id, quest_type: p.quest_type, minutes: p.minutes, tier: p.tier, disputed: p.disputed, evidence: p.evidence }, e.at);
    const maxXp = expected.type === 'quest_completed' ? expected.payload.xp : 0;
    const maxBanked = expected.type === 'quest_completed' ? expected.payload.banked : 0;
    if (p.xp > maxXp || p.banked > maxBanked) {
      clamped++;
      out.push({ ...e, payload: { ...p, xp: Math.min(p.xp, maxXp), banked: Math.min(p.banked, maxBanked) } });
    } else out.push(e);
  }
  return { events: out, clamped };
}

/** The leaderboard over one JSON file. All methods return a status and a JSON body for the HTTP layer. */
export function createLeaderboard(path: string) {
  const board: Board = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Board) : { players: {} };
  const lastPost = new Map<string, number>();
  // ponytail: rewrites the whole file per change; move to SQLite if the board passes a few hundred players
  const save = () => writeFileSync(path, JSON.stringify(board));

  const register = (body: unknown): Reply => {
    const { user_id, username } = (body ?? {}) as { user_id?: unknown; username?: unknown };
    if (typeof user_id !== 'string' || user_id.length < 16 || user_id.length > 64) return { status: 400, body: { error: 'user_id required' } };
    const name = typeof username === 'string' ? username.trim().toLowerCase() : '';
    if (!isCleanUsername(name)) return { status: 400, body: { error: 'Use 3 to 16 letters, numbers or _, and keep it clean.' } };
    const existing = board.players[user_id];
    if (existing) return existing.username === name ? { status: 200, body: { username: name } } : { status: 409, body: { error: `This phone already joined as ${existing.username}.` } };
    if (Object.values(board.players).some((p) => p.username === name)) return { status: 409, body: { error: 'That name is taken.' } };
    board.players[user_id] = { username: name, created_at: Date.now(), events: [] };
    save();
    return { status: 201, body: { username: name } };
  };

  const upload = (body: unknown, now: number): Reply => {
    const { user_id, events } = (body ?? {}) as { user_id?: unknown; events?: unknown };
    const player = typeof user_id === 'string' ? board.players[user_id] : undefined;
    if (!player || typeof user_id !== 'string') return { status: 404, body: { error: 'Join the leaderboard first.' } };
    if (now - (lastPost.get(user_id) ?? 0) < MIN_POST_GAP_MS) return { status: 429, body: { error: 'Too fast, try again in a moment.' } };
    lastPost.set(user_id, now);
    if (!Array.isArray(events) || events.length > MAX_BATCH) return { status: 400, body: { error: `events must be an array of at most ${MAX_BATCH}` } };
    const parsed: GameEvent[] = [];
    for (const raw of events) {
      const result = gameEventSchema.safeParse(raw);
      if (!result.success || result.data.at > now + 5 * 60_000) return { status: 400, body: { error: 'bad event' } };
      parsed.push(result.data);
    }
    const known = new Set(player.events.map((e) => e.id));
    const merged = [...player.events, ...parsed.filter((e) => !known.has(e.id))];
    if (merged.length > MAX_EVENTS) return { status: 413, body: { error: 'ledger too large' } };
    const checked = clampToRules(merged);
    player.events = checked.events;
    save();
    return { status: 200, body: { stored: checked.events.length, clamped: checked.clamped } };
  };

  const ranking = (period: 'week' | 'all', userId: string | undefined, now: number): Reply => {
    // ponytail: recomputes every player per request; cache per minute if the board gets busy
    const rows = Object.entries(board.players).map(([id, p]) => {
      const state = deriveState(p.events, now);
      const before = period === 'week' ? deriveState(p.events.filter((e) => e.at < now - WEEK_MS), now - WEEK_MS).totalXp : 0;
      return { id, username: p.username, xp: state.totalXp - before, level: state.level.level };
    });
    rows.sort((a, b) => b.xp - a.xp || a.username.localeCompare(b.username));
    const ranked: (BoardRow & { id: string })[] = rows.map((r, i) => ({ ...r, rank: i + 1 }));
    const strip = ({ rank, username, xp, level }: BoardRow) => ({ rank, username, xp, level });
    const me = ranked.find((r) => r.id === userId);
    return { status: 200, body: { period, rows: ranked.slice(0, 50).map(strip), me: me ? strip(me) : null, players: ranked.length } };
  };

  return { register, upload, ranking };
}
