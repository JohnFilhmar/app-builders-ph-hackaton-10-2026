import { initLlama, type LlamaContext, type RNLlamaOAICompatibleMessage } from 'llama.rn';

import { modelFilePath } from '@/lib/models/modelPaths';
import type { CatalogModel } from '@/types/catalog';
import type { ChatMessage, InferenceOutput } from '@/types/chat';

// ponytail: one resident GGUF at a time keeps 4 GB phones alive; swap to an LRU of 2 if chaining models needs it
let loaded: { modelId: string; ctx: LlamaContext } | null = null;

async function ensureContext(model: CatalogModel): Promise<{ ctx: LlamaContext; loadMs: number | null }> {
  if (loaded?.modelId === model.id) return { ctx: loaded.ctx, loadMs: null };
  await releaseLlama();

  const weights = model.files.find((f) => f.role === 'model');
  const mmproj = model.files.find((f) => f.role === 'mmproj');
  if (!weights) throw new Error(`${model.id} has no model file`);

  const started = Date.now();
  const ctx = await initLlama({
    model: `file://${modelFilePath(weights)}`,
    n_ctx: 2048,
    n_gpu_layers: 99,
    use_mlock: false,
    // multimodal contexts must not shift the KV cache
    ctx_shift: !mmproj,
  });
  if (mmproj) {
    const ok = await ctx.initMultimodal({ path: `file://${modelFilePath(mmproj)}`, use_gpu: true });
    if (!ok) {
      await ctx.release();
      throw new Error(`${model.id}: failed to load mmproj`);
    }
  }
  loaded = { modelId: model.id, ctx };
  return { ctx, loadMs: Date.now() - started };
}

/**
 * Runs a chat completion on-device, streaming tokens. Loads the model first if another one is resident.
 * @param model llama-runtime catalog model
 * @param messages conversation so far
 * @param onToken receives the accumulated text as tokens arrive
 * @param imagePath optional local image path for vision models
 */
export async function runLlamaChat(
  model: CatalogModel,
  messages: ChatMessage[],
  onToken: (textSoFar: string) => void,
  imagePath?: string,
): Promise<InferenceOutput> {
  const { ctx, loadMs } = await ensureContext(model);
  const oaiMessages: RNLlamaOAICompatibleMessage[] = messages.map((m, i) =>
    imagePath && i === messages.length - 1 && m.role === 'user'
      ? { role: m.role, content: [{ type: 'image_url', image_url: { url: imagePath } }, { type: 'text', text: m.content }] }
      : { role: m.role, content: m.content },
  );

  let text = '';
  const started = Date.now();
  // same sampling for every model so runs compare fairly; the repeat penalty stops small models looping
  const sampling = { n_predict: 256, temperature: 0.3, top_p: 0.9, penalty_repeat: 1.15, penalty_last_n: 128 };
  const result = await ctx.completion({ messages: oaiMessages, ...sampling }, (data) => {
    text += data.token;
    onToken(text);
  });
  return {
    text: result.content || result.text,
    loadMs,
    latencyMs: Date.now() - started,
    tokensPerS: result.timings.predicted_per_second || null,
  };
}

/** Frees the resident GGUF, if any. */
export async function releaseLlama(): Promise<void> {
  if (!loaded) return;
  const { ctx } = loaded;
  loaded = null;
  await ctx.release();
}
