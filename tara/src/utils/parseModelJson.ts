/**
 * Parses the JSON object in a model's reply. Small models sometimes wrap it in chat-template tokens or prose
 * ("<start_of_turn>model {...}"), so this reads from the first "{" to the last "}". Returns null when there is none,
 * and logs the raw reply under `tag` so a failure on the phone shows what the model said.
 * @param text the model's reply
 * @param tag log label, e.g. "chat"
 */
export function parseModelJson(text: string, tag: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      // falls through to the log below
    }
  }
  console.warn(`[${tag}] reply was not JSON: ${text.slice(0, 240).replace(/\s+/g, ' ')}`);
  return null;
}
