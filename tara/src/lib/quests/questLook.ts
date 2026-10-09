import type { PixelIconName } from '@/components/poly/PixelIcon';
import type { Translate } from '@/lib/i18n/translate';
import { QUEST_INFO } from '@/lib/quests/questTypes';
import type { ProofTier, QuestType } from '@/types/gameEvents';

/** Pixel icon per quest type. */
export const QUEST_ICON: Record<QuestType, PixelIconName> = {
  linis: 'broom',
  aral: 'book',
  basa: 'mic',
  ehersisyo: 'dumbbell',
  sariling: 'heart',
};

/** Quest type name in the app language. */
export const questName = (type: QuestType, t: Translate) => t(QUEST_INFO[type].english, QUEST_INFO[type].label);

/** Proof tier name in the app language, with its XP multiplier. */
export const tierName = (tier: ProofTier, t: Translate) =>
  ({ sabi_ko: t('Said so', 'Sabi Ko'), nakita: t('Seen', 'Nakita'), patunay: t('Proven', 'Patunay') })[tier];

/** How a quest type is proven, with the multiplier it can reach, in the app language. */
export const proofHint = (type: QuestType, t: Translate) =>
  ({
    linis: t('Before & After photos · up to 3x', 'Before & After na litrato · hanggang 3x'),
    aral: t('Quiz from your notes · up to 3x', 'Quiz mula sa notes mo · hanggang 3x'),
    basa: t('Read a page aloud · up to 3x', 'Basahin nang malakas · hanggang 3x'),
    ehersisyo: t('Count reps aloud · up to 3x', 'Bilangin nang malakas · hanggang 3x'),
    sariling: t('Your word · 1x', 'Salita mo · 1x'),
  })[type];

/** Icon for how a quest type is proven. */
export const PROOF_ICON: Record<QuestType, PixelIconName> = { linis: 'camera', aral: 'book', basa: 'mic', ehersisyo: 'mic', sariling: 'heart' };
