import { z } from 'zod';

import type { ChatMessage, InferenceOutput } from '@/types/chat';

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
  usage: z.object({ completion_tokens: z.number() }).optional(),
});

/**
 * Runs a chat completion on a laptop model server over the LAN, for comparison with on-device numbers.
 * Works with any OpenAI-compatible server: llama.cpp `llama-server` or Ollama (`/v1`).
 * @param lanUrl server base URL, e.g. http://192.168.1.10:8080
 * @param lanModel model name the server expects (Ollama needs it; llama-server ignores it)
 * @param messages conversation so far
 */
export async function runLanChat(lanUrl: string, lanModel: string, messages: ChatMessage[]): Promise<InferenceOutput> {
  if (!lanUrl) throw new Error('Set the LAN model server URL on the Models tab first');
  const started = Date.now();
  const res = await fetch(`${lanUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: lanModel || 'default', messages, max_tokens: 256, temperature: 0.3, stream: false }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`LAN server HTTP ${res.status}`);
  const body = completionSchema.parse(await res.json());
  const latencyMs = Date.now() - started;
  const tokens = body.usage?.completion_tokens;
  return {
    text: body.choices[0]?.message.content ?? '',
    loadMs: null,
    latencyMs,
    tokensPerS: tokens ? tokens / (latencyMs / 1000) : null,
  };
}
