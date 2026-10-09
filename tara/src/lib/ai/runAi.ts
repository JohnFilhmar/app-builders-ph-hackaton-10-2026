import type { CompletionResponseFormat } from 'llama.rn';

import { activeModel } from '@/lib/ai/activeModel';
import { useAiStore } from '@/lib/ai/aiSources';
import { remoteChat } from '@/lib/ai/remoteChat';
import { runLlamaChat } from '@/lib/runtimes/llamaRuntime';
import { transcribeWav } from '@/lib/runtimes/whisperRuntime';
import type { ChatMessage, Lang } from '@/types/chat';
import { errorMessage } from '@/utils/errorMessage';

type AiOptions = { maxTokens?: number; temperature?: number; responseFormat?: CompletionResponseFormat };

/**
 * Runs a text or vision job on the source chosen in AI settings: the phone, an Ollama laptop, or OpenRouter. A remote
 * failure (no Wi-Fi, laptop asleep, bad key) falls back to the on-device model, so a quest check never dead-ends.
 * @param capability "brain" for text, "eyes" for photos
 * @param messages the conversation
 * @param onToken receives the reply so far (remote replies arrive in one piece)
 * @param imagePath optional photo for vision jobs
 * @param options token budget, temperature and JSON schema
 */
export async function runAi(
  capability: 'brain' | 'eyes',
  messages: ChatMessage[],
  onToken: (textSoFar: string) => void,
  imagePath?: string,
  options: AiOptions = {},
): Promise<{ text: string }> {
  const source = useAiStore.getState().sources[capability];
  if (source.kind !== 'device') {
    try {
      const text = await remoteChat(source, messages, { ...options, imagePath });
      onToken(text);
      return { text };
    } catch (err) {
      console.warn(`[ai] ${capability} on ${source.kind} failed, using the phone: ${errorMessage(err)}`);
    }
  }
  return runLlamaChat(activeModel(capability), messages, onToken, imagePath, options);
}

/**
 * Speech to text on the chosen "ears" source: on-device Whisper, or an audio-capable OpenRouter model. Ollama has no
 * speech-to-text, so a LAN choice is never offered for ears. Falls back to the phone on a remote failure.
 * @param wavPath 16 kHz mono WAV slice
 * @param lang language hint
 * @param prompt vocabulary hint, e.g. counting words
 */
export async function transcribe(wavPath: string, lang: Lang | 'auto', prompt?: string): Promise<{ text: string }> {
  const source = useAiStore.getState().sources.ears;
  if (source.kind === 'cloud') {
    try {
      const hint = lang === 'tl' ? ' It is in Tagalog or Taglish.' : lang === 'en' ? ' It is in English.' : '';
      const text = await remoteChat(
        source,
        [{ role: 'user', content: `Transcribe this audio exactly as spoken.${hint} Reply with only the spoken words, nothing else.${prompt ? ` Context: ${prompt}` : ''}` }],
        { audioPath: wavPath, maxTokens: 200, temperature: 0 },
      );
      return { text: text.trim() };
    } catch (err) {
      console.warn(`[ai] ears on cloud failed, using the phone: ${errorMessage(err)}`);
    }
  }
  return transcribeWav(activeModel('ears'), wavPath, lang, prompt);
}
