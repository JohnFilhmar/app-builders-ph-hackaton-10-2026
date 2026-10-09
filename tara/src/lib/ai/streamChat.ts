import { splitSse } from '@/utils/sse';

/** Reads one key of an unknown JSON value, narrowing instead of casting. */
function field(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== 'object' || !(key in obj)) return undefined;
  const record: { [k: string]: unknown } = { ...obj };
  return record[key];
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');

/**
 * A streamed OpenAI-style chat completion. React Native's fetch cannot read a body as it arrives, so this uses
 * XMLHttpRequest progress events. Reasoning (Ollama and OpenRouter send it as `reasoning`, some servers as
 * `reasoning_content`) and the answer are reported separately as they grow.
 * @param url the /chat/completions endpoint
 * @param headers request headers
 * @param body the request body; `stream: true` is added
 * @param onDelta receives the reasoning and the answer so far
 * @param timeoutMs give up after this long
 */
export function streamChat(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  onDelta: (reasoning: string, content: string) => void,
  timeoutMs: number,
): Promise<{ reasoning: string; content: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let seen = 0;
    let pending = '';
    let reasoning = '';
    let content = '';
    const take = () => {
      const chunk = xhr.responseText.slice(seen);
      seen = xhr.responseText.length;
      const { events, rest } = splitSse(pending + chunk);
      pending = rest;
      for (const event of events) {
        const choices = field(event, 'choices');
        const delta = Array.isArray(choices) ? field(choices[0], 'delta') : undefined;
        reasoning += text(field(delta, 'reasoning')) + text(field(delta, 'reasoning_content'));
        content += text(field(delta, 'content'));
      }
      onDelta(reasoning, content);
    };
    xhr.open('POST', url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.timeout = timeoutMs;
    xhr.onprogress = take;
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Server said ${xhr.status}: ${xhr.responseText.slice(0, 160)}`));
        return;
      }
      take();
      if (pending.trim()) {
        pending += '\n';
        take();
      }
      resolve({ reasoning, content });
    };
    xhr.onerror = () => reject(new Error('Network error while streaming'));
    xhr.ontimeout = () => reject(new Error('The model took too long'));
    xhr.send(JSON.stringify({ ...body, stream: true }));
  });
}
