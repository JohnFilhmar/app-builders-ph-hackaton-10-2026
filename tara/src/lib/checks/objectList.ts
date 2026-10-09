// things people tidy away, in the words small vision models use; scenery like tables and walls is left out on purpose
const HOUSEHOLD = [
  'cup', 'mug', 'glass', 'bottle', 'can', 'plate', 'bowl', 'spoon', 'fork', 'book', 'notebook', 'paper', 'pen', 'pencil',
  'phone', 'laptop', 'keyboard', 'mouse', 'bag', 'shoe', 'shirt', 'clothes', 'towel', 'pillow', 'blanket', 'toy', 'box',
  'wrapper', 'tissue', 'remote', 'charger', 'cable', 'jar', 'container', 'straw', 'napkin', 'trash', 'sock', 'jacket',
];

/**
 * Household objects a vision model mentioned in its description, in order, at most `limit`. Matches singular and
 * plural ("cups", "glasses"), so the check can then ask about each one by name.
 * @param description the model's free-text description of a photo
 * @param limit most objects to keep
 */
export function mentionedObjects(description: string, limit = 4): string[] {
  const text = description.toLowerCase();
  // "paper cup" is a cup: a word directly followed by another object name is a modifier, not an object
  const modifier = String.raw`(?!\s+(${HOUSEHOLD.join('|')})\b)`;
  return HOUSEHOLD.map((name) => ({ name, at: text.search(new RegExp(String.raw`\b${name}(s|es)?\b${modifier}`)) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at)
    .slice(0, limit)
    .map((m) => m.name);
}

/** True when a short yes/no answer from a small model means yes. */
export const saidYes = (answer: string): boolean => /^\W*(yes|yeah|yep|there is|there are)\b/i.test(answer.trim());
