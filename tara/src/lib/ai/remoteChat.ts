import { File } from 'expo-file-system';

import { cloudKey, type RemoteSource } from '@/lib/ai/aiSources';
import type { ChatMessage } from '@/types/chat';

const OPENROUTER = 'https://openrouter.ai/api/v1';

type RemoteOptions = { maxTokens?: number; temperature?: number; responseFormat?: unknown; imagePath?: string; audioPath?: string };
type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'input_audio'; input_audio: { data: string; format: 'wav' } };

const fileBase64 = (path: string) => new File(path.startsWith('file://') ? path : `file://${path}`).base64();

/** Reads one key of an unknown JSON value, narrowing instead of casting. */
function field(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== 'object' || !(key in obj)) return undefined;
  const record: { [k: string]: unknown } = { ...obj };
  return record[key];
}

/** URL and headers for an OpenAI-compatible chat endpoint: Ollama serves one at /v1, OpenRouter natively. */
async function endpoint(source: RemoteSource): Promise<{ url: string; headers: Record<string, string> }> {
  if (source.kind === 'lan') return { url: `${source.base_url}/v1/chat/completions`, headers: { 'Content-Type': 'application/json' } };
  const key = await cloudKey.get();
  if (!key) throw new Error('No OpenRouter key set in AI settings');
  return { url: `${OPENROUTER}/chat/completions`, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'X-Title': 'Tara LEVEL UP' } };
}

/**
 * One chat completion on a remote OpenAI-compatible server (an Ollama laptop or OpenRouter). An image or a WAV clip
 * rides along with the last user message as base64. Not streamed: the whole reply comes back at once.
 * @param source the LAN or cloud source to use
 * @param messages the conversation
 * @param options token budget, temperature, JSON schema, and an optional image or audio file
 */
export async function remoteChat(source: RemoteSource, messages: ChatMessage[], options: RemoteOptions = {}): Promise<string> {
  const { url, headers } = await endpoint(source);
  const attachment: ContentPart | null = options.imagePath
    ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${await fileBase64(options.imagePath)}` } }
    : options.audioPath
      ? { type: 'input_audio', input_audio: { data: await fileBase64(options.audioPath), format: 'wav' } }
      : null;
  const body = {
    model: source.model,
    messages: messages.map((m, i) =>
      attachment && i === messages.length - 1 && m.role === 'user' ? { role: m.role, content: [attachment, { type: 'text', text: m.content }] } : { role: m.role, content: m.content },
    ),
    max_tokens: options.maxTokens ?? 256,
    temperature: options.temperature ?? 0.3,
    stream: false,
    ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
  };
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(90_000) });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${source.kind === 'lan' ? 'Laptop' : 'OpenRouter'} said ${res.status}: ${JSON.stringify(json).slice(0, 160)}`);
  const choices = field(json, 'choices');
  const text = Array.isArray(choices) ? field(field(choices[0], 'message'), 'content') : undefined;
  if (typeof text !== 'string') throw new Error('The server sent a reply Tara could not read');
  return text;
}

/**
 * Speech to text on a laptop Whisper server through the OpenAI-style /v1/audio/transcriptions endpoint (whisper.cpp
 * server, speaches and LocalAI all serve it). Ollama has no speech-to-text, so voice uses a separate server.
 * @param source the LAN source (base_url and model name)
 * @param wavPath 16 kHz mono WAV slice
 * @param lang language hint
 * @param prompt vocabulary hint
 */
export async function remoteTranscribe(source: Extract<RemoteSource, { kind: 'lan' }>, wavPath: string, lang: 'en' | 'tl' | 'auto', prompt?: string): Promise<string> {
  const form = new FormData();
  form.append('file', new File(wavPath.startsWith('file://') ? wavPath : `file://${wavPath}`), 'audio.wav');
  form.append('model', source.model || 'whisper-1');
  form.append('response_format', 'json');
  if (lang !== 'auto') form.append('language', lang);
  if (prompt) form.append('prompt', prompt);
  const res = await fetch(`${source.base_url}/v1/audio/transcriptions`, { method: 'POST', body: form, signal: AbortSignal.timeout(30_000) });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Laptop said ${res.status}: ${JSON.stringify(json).slice(0, 160)}`);
  const text = field(json, 'text');
  if (typeof text !== 'string') throw new Error('The voice server sent a reply Tara could not read');
  return text;
}

/**
 * Model names a source offers, for the settings pickers. Ollama lists its pulled models; OpenRouter lists models that
 * accept the needed input (image or audio), so the list is current instead of hard-coded.
 * @param source where to look; for LAN only base_url is used
 * @param needs input the job requires
 */
export async function listModels(source: RemoteSource, needs: 'text' | 'image' | 'audio'): Promise<string[]> {
  if (source.kind === 'lan' && needs === 'audio') {
    // Whisper servers follow OpenAI's /v1/models; whisper.cpp has none and accepts any name, so an empty list is fine
    const res = await fetch(`${source.base_url}/v1/models`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = field(await res.json(), 'data');
    return Array.isArray(data) ? data.map((m) => field(m, 'id')).filter((id): id is string => typeof id === 'string') : [];
  }
  if (source.kind === 'lan') {
    const res = await fetch(`${source.base_url}/api/tags`, { signal: AbortSignal.timeout(6000) });
    const models = field(await res.json(), 'models');
    return Array.isArray(models) ? models.map((m) => field(m, 'name')).filter((n): n is string => typeof n === 'string') : [];
  }
  const res = await fetch(`${OPENROUTER}/models`, { signal: AbortSignal.timeout(10_000) });
  const data = field(await res.json(), 'data');
  if (!Array.isArray(data)) return [];
  return data
    .filter((m) => {
      const inputs = field(field(m, 'architecture'), 'input_modalities');
      return Array.isArray(inputs) ? inputs.includes(needs) : needs === 'text';
    })
    .map((m) => field(m, 'id'))
    .filter((id): id is string => typeof id === 'string');
}
