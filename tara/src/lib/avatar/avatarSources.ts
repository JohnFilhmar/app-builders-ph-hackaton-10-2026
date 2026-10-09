import femaleHero from '../../../assets/avatar/female_jump.glb';
import type { BaseAvatar } from '@/types/gameEvents';

/**
 * Hero GLB per gender. The file carries the character plus its clips; the clip named like "idle" loops and the one
 * named like "jump" plays on tap. Without a jump clip the hero does a code-driven hop.
 * female_jump.glb already holds both Idle and Jump, so female_idle.glb is not bundled.
 */
export const AVATAR_SOURCES: Record<BaseAvatar, { file: number; facesAway: boolean }> = {
  female: { file: femaleHero, facesAway: false },
  // ponytail: no male GLB yet, so both heroes share the female rig; add male_jump.glb here when it lands
  male: { file: femaleHero, facesAway: false },
};
