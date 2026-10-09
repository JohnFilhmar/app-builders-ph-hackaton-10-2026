// "and", commas and their Tagalog forms separate tasks; "at" only when it is not "at 7pm"
const SEPARATORS = /\s*(?:,|;|\band then\b|\bthen\b|\band\b|\btapos\b|\bsaka\b|\bat\b(?!\s*\d|\s+alas))\s*/i;

/**
 * Cleans one task phrase into a quest title: drops "I'm going to", the day and the clock time, which live in the
 * schedule instead. "I am going to the gym tomorrow at 7pm" -> "The gym".
 * @param phrase one task from the message
 */
export function cleanTitle(phrase: string): string {
  const title = phrase
    .replace(/\b(i am|i'm|im|i will|i'll|i need to|i have to|i want to|i'm gonna|ako ay)\s+(going to\s+|gonna\s+)?(go to\s+)?/gi, '')
    .replace(/\b(tomorrow|tmrw|bukas|today|tonight|later|mamaya|ngayon)\b/gi, '')
    .replace(/\b(at|alas)?\s*\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.|ng umaga|ng hapon|ng gabi)\b/gi, '')
    .replace(/\b(at|alas)\s+\d{1,2}(:\d{2})?\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '');
  return title ? (title.charAt(0).toUpperCase() + title.slice(1)).slice(0, 60) : '';
}

/**
 * Splits a chat message into task phrases ("clean my room and study math tomorrow" -> two), at most 4, each cleaned.
 * Rule-based on purpose: the 1B model copied instruction words as titles when asked to do this.
 * @param message what the user typed or said
 */
export function splitTasks(message: string): string[] {
  const titles = message
    .split(SEPARATORS)
    .map(cleanTitle)
    .filter((t) => t.length >= 2);
  return titles.length > 0 ? titles.slice(0, 4) : [cleanTitle(message) || message.trim().slice(0, 60)];
}
