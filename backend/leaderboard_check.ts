// Self-check for the leaderboard rules. Run: npm run check
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { completeQuest } from '@/lib/game/completeQuest';
import type { GameEvent } from '@/types/gameEvents';

import { clampToRules, createLeaderboard, isCleanUsername } from './leaderboard.ts';

const NOW = Date.now();
const lb = createLeaderboard(join(mkdtempSync(join(tmpdir(), 'lb-')), 'board.json'));
const A = 'a'.repeat(32);
const B = 'b'.repeat(32);

assert.equal(isCleanUsername('juan_dc'), true);
assert.equal(isCleanUsername('Juan'), false, 'uppercase is lowered by register, not accepted raw');
assert.equal(isCleanUsername('xx'), false);
assert.equal(isCleanUsername('gagoboy'), false);

assert.equal(lb.register({ user_id: A, username: 'Juan_DC' }).status, 201);
assert.equal(lb.register({ user_id: A, username: 'juan_dc' }).status, 200, 'joining again with the same name is fine');
assert.equal(lb.register({ user_id: A, username: 'other' }).status, 409, 'a phone keeps its first name');
assert.equal(lb.register({ user_id: B, username: 'juan_dc' }).status, 409, 'names are unique');
assert.equal(lb.register({ user_id: B, username: 'maria' }).status, 201);

const ledger: GameEvent[] = [{ id: 'p', type: 'profile_created', at: NOW - 60_000, payload: { base_avatar: 'male' } }];
ledger.push(completeQuest(ledger, { quest_id: 'q1', quest_type: 'linis', minutes: 30, tier: 'patunay', disputed: false }, NOW - 30_000));
const honest = ledger[1];
assert.ok(honest && honest.type === 'quest_completed');
const forged: GameEvent = { ...honest, id: 'forged', payload: { ...honest.payload, quest_id: 'q2', xp: 9999 } };

const checked = clampToRules([...ledger, forged]);
assert.equal(checked.clamped, 1, 'the forged quest is lowered');
const lowered = checked.events.find((e) => e.id === 'forged');
assert.ok(lowered && lowered.type === 'quest_completed' && lowered.payload.xp < 9999);

assert.equal(lb.upload({ user_id: A, events: ledger }, NOW).status, 200);
assert.equal(lb.upload({ user_id: A, events: ledger }, NOW + 100).status, 429, 'uploads are rate limited');
assert.equal(lb.upload({ user_id: 'nobody'.repeat(4), events: [] }, NOW).status, 404);
assert.equal(lb.upload({ user_id: B, events: [{ id: 'x', type: 'not_a_type', at: NOW, payload: {} }] }, NOW).status, 400, 'bad events are refused');

const board = lb.ranking('week', B, NOW);
const body = board.body as { rows: { username: string; rank: number; xp: number }[]; me: { rank: number } | null };
assert.deepEqual(
  body.rows.map((r) => r.username),
  ['juan_dc', 'maria'],
);
assert.equal(body.rows[0]?.xp, honest.payload.xp);
assert.equal(body.me?.rank, 2);
assert.ok(!JSON.stringify(board.body).includes(A), 'user ids never leave the server');

assert.equal(lb.reset({ user_id: A }).status, 200);
const afterReset = lb.ranking('all', A, NOW).body as { rows: { username: string; xp: number }[] };
assert.equal(afterReset.rows.find((r) => r.username === 'juan_dc')?.xp, 0, 'a reset player keeps the name at 0 XP');
assert.equal(lb.reset({ user_id: 'nobody'.repeat(4) }).status, 404);

console.log('leaderboard check passed');
