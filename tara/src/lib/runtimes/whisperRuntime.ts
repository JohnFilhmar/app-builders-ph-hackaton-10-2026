// whisper.rn's exports map has no "." entry, only "./*", so the bare specifier does not resolve
import { initWhisper, type WhisperContext } from 'whisper.rn/index';

import { modelFilePath } from '@/lib/models/modelPaths';
import type { CatalogModel } from '@/types/catalog';
import type { InferenceOutput, Lang } from '@/types/chat';

let loaded: { modelId: string; ctx: WhisperContext } | null = null;

/**
 * Transcribes a 16 kHz mono WAV file on-device.
 * @param model whisper-runtime catalog model
 * @param wavPath local WAV path (no file:// prefix)
 * @param lang spoken language hint, or 'auto' to let whisper detect it
 * @param prompt optional vocabulary hint, e.g. counting words
 */
export async function transcribeWav(model: CatalogModel, wavPath: string, lang: Lang | 'auto', prompt?: string): Promise<InferenceOutput> {
  let loadMs: number | null = null;
  if (loaded?.modelId !== model.id) {
    if (loaded) await loaded.ctx.release();
    loaded = null;
    const weights = model.files.find((f) => f.role === 'model');
    if (!weights) throw new Error(`${model.id} has no model file`);
    const started = Date.now();
    loaded = { modelId: model.id, ctx: await initWhisper({ filePath: modelFilePath(weights) }) };
    loadMs = Date.now() - started;
  }

  const started = Date.now();
  const { promise } = loaded.ctx.transcribe(wavPath, { language: lang, maxThreads: 4, ...(prompt ? { prompt } : {}) });
  const result = await promise;
  return { text: result.result.trim(), loadMs, latencyMs: Date.now() - started, tokensPerS: null };
}
