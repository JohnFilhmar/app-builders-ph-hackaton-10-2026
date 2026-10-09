/** Short motivation lines for Home, each in English and Tagalog. Kind, never guilt-tripping. */
export const QUOTES: { en: string; tl: string }[] = [
  { en: 'Small steps every day add up to big changes.', tl: 'Ang maliliit na hakbang araw-araw ay nagiging malaking pagbabago.' },
  { en: 'Done is better than perfect.', tl: 'Mas mabuti ang tapos kaysa perpekto.' },
  { en: 'Start where you are. Use what you have.', tl: 'Magsimula kung nasaan ka. Gamitin ang mayroon ka.' },
  { en: 'Your future self will thank you.', tl: 'Pasasalamatan ka ng sarili mo bukas.' },
  { en: 'Discipline is choosing what you want most over what you want now.', tl: 'Ang disiplina ay pagpili sa pinakagusto mo kaysa sa gusto mo ngayon.' },
  { en: 'One task at a time. You have got this.', tl: "Isang gawain sa isang pagkakataon. Kaya mo 'yan." },
  { en: 'Rest when you need to, but do not quit.', tl: 'Magpahinga kung kailangan, pero huwag sumuko.' },
  { en: 'Progress, not perfection.', tl: 'Pag-unlad, hindi pagiging perpekto.' },
  { en: 'The best time to start was yesterday. The next best time is now.', tl: 'Ang pinakamagandang oras magsimula ay kahapon. Ang susunod ay ngayon.' },
  { en: 'Sipag today, ginhawa tomorrow.', tl: 'Sipag ngayon, ginhawa bukas.' },
  { en: 'A clean space makes a clear mind.', tl: 'Malinis na paligid, malinaw na isip.' },
  { en: 'Every expert was once a beginner.', tl: 'Lahat ng magaling ay nagsimula bilang baguhan.' },
  { en: 'Consistency beats intensity.', tl: 'Mas panalo ang tuloy-tuloy kaysa sa biglaan.' },
  { en: 'You do not have to be great to start, but you have to start to be great.', tl: 'Hindi mo kailangang maging magaling para magsimula, pero kailangan mong magsimula para gumaling.' },
  { en: 'Kapag may tiyaga, may nilaga.', tl: 'Kapag may tiyaga, may nilaga.' },
];

/**
 * A quote for this moment. Changes each time Home opens, but stays put while you scroll.
 * @param seed any number that changes per visit
 */
export const pickQuote = (seed: number) => QUOTES[Math.abs(Math.floor(seed)) % QUOTES.length] ?? QUOTES[0];
