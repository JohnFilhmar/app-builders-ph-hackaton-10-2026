import { exportBackup, parseBackup } from '@/lib/game/backup';
import { buildDemoEvents } from '@/lib/game/demoSeed';

const NOW = new Date(2026, 9, 20, 10, 0, 0).getTime();

describe('backup', () => {
  it('round-trips the ledger', () => {
    const events = buildDemoEvents(NOW);
    const parsed = parseBackup(exportBackup(events, NOW));
    expect(parsed).toEqual({ ok: true, events });
  });

  it('rejects text that is not JSON', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, reason: 'Hindi mabasa ang file (not a Tara backup).' });
  });

  it('rejects a file from another app', () => {
    expect(parseBackup(JSON.stringify({ hello: 'world' })).ok).toBe(false);
  });

  it('rejects a backup with a malformed event', () => {
    const bad = JSON.stringify({ format: 'tara-backup', version: 1, exported_at: NOW, events: [{ id: 'x', type: 'quest_completed', at: 1, payload: {} }] });
    expect(parseBackup(bad).ok).toBe(false);
  });
});
