/**
 * Splits a server-sent-events buffer into the JSON payloads of its complete `data:` lines. The unfinished tail is
 * returned so the caller can prepend it to the next chunk. `[DONE]` and lines that are not JSON are skipped.
 * @param buffer text received so far that has not been parsed yet
 */
export function splitSse(buffer: string): { events: unknown[]; rest: string } {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';
  const events: unknown[] = [];
  for (const line of lines) {
    const data = line.trim().replace(/^data:\s*/, '');
    if (!line.trim().startsWith('data:') || !data || data === '[DONE]') continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      // a keep-alive comment or a malformed line; the stream goes on
    }
  }
  return { events, rest };
}
