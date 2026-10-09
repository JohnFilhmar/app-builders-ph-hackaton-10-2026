/**
 * Real art for the scene slots. Each slot is empty until the art lands; the polygon placeholder in
 * components/scene draws in its place. To swap one in, drop the file in assets/scene/ and require it here, e.g.
 *   home_backdrop: require('../../../assets/scene/home_backdrop.png'),
 * Suggested files: home_backdrop.png and onboarding_backdrop.png (portrait, 1080x1350), aura.png (square, transparent),
 * level_up_fx.png and quest_done_fx.png (square, transparent, drawn behind the hero).
 */
export const SCENE_ART: Partial<Record<'home_backdrop' | 'onboarding_backdrop' | 'aura' | 'level_up_fx' | 'quest_done_fx', number>> = {};
