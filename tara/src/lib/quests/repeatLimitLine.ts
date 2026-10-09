import { RULES } from '@/lib/game/constants';
import type { Translate } from '@/lib/i18n/translate';
import type { QuestType } from '@/types/gameEvents';

// a wink at what the player is up to, per quest type; Tara teases, never scolds
const JOKE: Record<QuestType, [string, string]> = {
  linis: ["Is this spot the cleanest in the whole barangay yet? Your walis needs a merienda break.", 'Ito na ba ang pinakamalinis na puwesto sa buong barangay? Pagod na ang walis mo, kailangan ng merienda.'],
  aral: ['Your brain is so full the extra knowledge is leaking out of your ears!', 'Sobrang puno na ng utak mo, tumatagas na ang dunong sa tenga mo!'],
  basa: ["At this rate the library will start charging you rent.", 'Sa bilis mo, sisingilin ka na ng upa ng library.'],
  ehersisyo: ['Your muscles just filed a formal complaint with the barangay captain.', 'Nagreklamo na ang mga muscles mo kay kapitan.'],
  sariling: ['Wow, a whole marathon of your own tasks!', 'Grabe, marathon ng sariling Gawain!'],
};

/**
 * What Tara says about the anti-farming rule: a joke for the quest type, then the rule in plain words.
 * @param type the quest type that hit RULES.repeatLimit today
 * @param when 'before' warns at the start of a quest, 'after' explains the +0 on the result
 * @param t translator
 */
export function repeatLimitLine(type: QuestType, when: 'before' | 'after', t: Translate): string {
  const [joke_en, joke_tl] = JOKE[type];
  const n = RULES.repeatLimit;
  return when === 'before'
    ? t(
        `${joke_en} Heads up: only the first ${n} of this kind each day earn Sipag. You can still do it, it counts as done, but a different kind of quest earns more.`,
        `${joke_tl} Paalala: ang unang ${n} lang ng ganitong uri bawat araw ang may Sipag. Puwede mo pa ring gawin, bilang itong tapos, pero mas may Sipag ang ibang uri ng Gawain.`,
      )
    : t(
        `${joke_en} You already did ${n} of this kind today, the most that earn Sipag, so this one is +0. It still counts as done! Try a different kind of quest for more Sipag.`,
        `${joke_tl} ${n} na ng ganitong uri ang nagawa mo ngayon, iyon ang may Sipag, kaya +0 ito. Bilang pa rin itong tapos! Subukan ang ibang uri ng Gawain para sa dagdag na Sipag.`,
      );
}
