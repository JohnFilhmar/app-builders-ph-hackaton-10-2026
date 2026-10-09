const normalize = (text: string): string[] =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ''))
    .filter(Boolean);

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = row[j] ?? 0;
      row[j] = Math.min((row[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = temp;
    }
  }
  return row[b.length] ?? 0;
}

// speech models misspell long words by a letter or two; accent and Taglish spelling are never judged
const sameWord = (a: string, b: string) => a === b || (a.length >= 5 && editDistance(a, b) <= 1) || (a.length >= 6 && editDistance(a, b) <= 2);

export type ReadingScore = { matched: number; total: number; ratio: number; skipped: string[] };

/**
 * How much of a passage was read aloud: each passage word counts once if the transcript contains it (fuzzy).
 * @param passage the text the user was asked to read
 * @param transcript what the speech model heard
 */
export function scoreReading(passage: string, transcript: string): ReadingScore {
  const target = normalize(passage);
  const heard = normalize(transcript);
  const used = new Array<boolean>(heard.length).fill(false);
  const skipped: string[] = [];
  let matched = 0;
  for (const word of target) {
    const at = heard.findIndex((h, i) => !used[i] && sameWord(word, h));
    if (at >= 0) {
      used[at] = true;
      matched += 1;
    } else skipped.push(word);
  }
  return { matched, total: target.length, ratio: target.length ? matched / target.length : 0, skipped };
}

const ONES_EN: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS_EN: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const ONES_TL: Record<string, number> = { isa: 1, dalawa: 2, tatlo: 3, apat: 4, lima: 5, anim: 6, pito: 7, walo: 8, siyam: 9, sampu: 10 };
const TENS_TL: Record<string, number> = { dalawampu: 20, tatlumpu: 30, apatnapu: 40, limampu: 50, animnapu: 60, pitumpu: 70, walumpu: 80, siyamnapu: 90 };

function wordToNumber(word: string): number | null {
  if (/^\d+$/.test(word)) return Number(word);
  if (word in ONES_EN) return ONES_EN[word] ?? null;
  if (word in TENS_EN) return TENS_EN[word] ?? null;
  const enCompound = word.match(/^([a-z]+)-([a-z]+)$/);
  if (enCompound && enCompound[1] && enCompound[2] && enCompound[1] in TENS_EN && enCompound[2] in ONES_EN) {
    return (TENS_EN[enCompound[1]] ?? 0) + (ONES_EN[enCompound[2]] ?? 0);
  }
  if (word in ONES_TL) return ONES_TL[word] ?? null;
  // labing-isa .. labing-siyam (11..19)
  const labing = word.match(/^labing-?([a-z]+)$/) ?? word.match(/^labin-?([a-z]+)$/) ?? word.match(/^labim-?([a-z]+)$/);
  if (labing && labing[1] && labing[1] in ONES_TL) return 10 + (ONES_TL[labing[1]] ?? 0);
  // dalawampu't isa / dalawampu
  for (const [tens, value] of Object.entries(TENS_TL)) {
    if (word === tens || word === `${tens}'t`) return value;
    if (word.startsWith(tens)) {
      const rest = word.slice(tens.length).replace(/^'?t-?/, '');
      if (rest in ONES_TL) return value + (ONES_TL[rest] ?? 0);
    }
  }
  return null;
}

/**
 * The highest rep reached when counting aloud in English, Tagalog, Taglish or digits.
 * Handles split compounds ("twenty one", "dalawampu't isa").
 * @param transcript what the speech model heard
 */
export function highestCount(transcript: string): number {
  const words = normalize(transcript.replace(/'t\s+/g, "'t"));
  let best = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i] ?? '';
    const next = words[i + 1] ?? '';
    const pair = wordToNumber(`${w}-${next}`) ?? wordToNumber(`${w}${next}`);
    const single = wordToNumber(w);
    const value = (w in TENS_EN && next in ONES_EN) || Object.keys(TENS_TL).some((t) => w.startsWith(t)) && next in ONES_TL ? (pair ?? single) : single;
    if (value !== null && value <= 500) best = Math.max(best, value);
  }
  return best;
}
