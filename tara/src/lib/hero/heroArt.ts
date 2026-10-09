import level01 from '../../../assets/hero/level_01.png';
import level02 from '../../../assets/hero/level_02.png';
import level03 from '../../../assets/hero/level_03.png';
import level04 from '../../../assets/hero/level_04.png';
import level05 from '../../../assets/hero/level_05.png';
import level06 from '../../../assets/hero/level_06.png';
import level07 from '../../../assets/hero/level_07.png';
import level08 from '../../../assets/hero/level_08.png';
import level09 from '../../../assets/hero/level_09.png';
import level10 from '../../../assets/hero/level_10.png';

/**
 * One full-body hero image per level, 1 to 10. Metro only bundles literal paths, so the table is written out.
 * The art is male only for now, so every player gets this hero whatever baseAvatar says.
 */
export const HERO_ART = [level01, level02, level03, level04, level05, level06, level07, level08, level09, level10] as const;

/** The hero image for a level, clamped to the art that exists. */
export const heroArtFor = (level: number) => HERO_ART[Math.min(Math.max(Math.round(level), 1), HERO_ART.length) - 1] ?? level01;
