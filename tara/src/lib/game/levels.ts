import { LEVELS } from '@/lib/game/constants';

export type LevelInfo = { level: number; name: string; floorXp: number; nextXp: number | null; progress: number; pastCap: boolean };

/**
 * Level, name and progress for a total XP. Past the last MVP level the bar stays full and `pastCap` turns on,
 * which drives the "Malapit na" card.
 * @param totalXp all XP earned, never reduced by Pabuya spending
 */
export function levelForXp(totalXp: number): LevelInfo {
  let index = 0;
  LEVELS.forEach((l, i) => {
    if (totalXp >= l.xp) index = i;
  });
  const current = LEVELS[index] ?? LEVELS[0];
  const next = LEVELS[index + 1];
  if (!next) {
    return { level: current.level, name: current.name, floorXp: current.xp, nextXp: null, progress: 1, pastCap: totalXp > current.xp };
  }
  return {
    level: current.level,
    name: current.name,
    floorXp: current.xp,
    nextXp: next.xp,
    progress: (totalXp - current.xp) / (next.xp - current.xp),
    pastCap: false,
  };
}
