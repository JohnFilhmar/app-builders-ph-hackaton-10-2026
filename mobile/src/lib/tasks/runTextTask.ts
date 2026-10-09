import { makeRun } from '@/lib/results/makeRun';
import { runLanChat } from '@/lib/runtimes/lanRuntime';
import { runLlamaChat } from '@/lib/runtimes/llamaRuntime';
import type { CatalogModel, Lang } from '@/types/catalog';
import type { ChatMessage } from '@/types/chat';
import type { ExecutionTarget, RunResult } from '@/types/results';
import { errorMessage } from '@/utils/errorMessage';

export type TextMode = 'chat' | 'translate';

const SYSTEM_PROMPTS: Record<TextMode, Record<Lang, string>> = {
  chat: {
    en: 'You are a helpful assistant. Reply in English, briefly and clearly.',
    tl: 'Ikaw ay isang matulunging assistant. Sumagot sa Tagalog nang maikli at malinaw.',
  },
  translate: {
    en: 'Translate the user text from English to Tagalog (Filipino). Output only the translation.',
    tl: 'Translate the user text from Tagalog (Filipino) to English. Output only the translation.',
  },
};

type TextTaskInput = {
  mode: TextMode;
  /** chat: reply language; translate: source language */
  lang: Lang;
  target: ExecutionTarget;
  model: CatalogModel;
  input: string;
  lan: { url: string; model: string };
  onToken: (textSoFar: string) => void;
};

/**
 * Runs one chat or translation prompt on the phone or the LAN server and returns a scored-later run record.
 * Never throws: failures come back as a run with `error` set, so crashes and OOMs show up in the results table.
 * @param args task, language, target, model and prompt
 */
export async function runTextTask(args: TextTaskInput): Promise<RunResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPTS[args.mode][args.lang] },
    { role: 'user', content: args.input },
  ];
  const base = { task: args.mode, lang: args.lang, target: args.target, input: args.input, realtime_factor: null };
  const modelId = args.target === 'lan' ? `lan:${args.lan.model || 'default'}` : args.model.id;
  try {
    const out =
      args.target === 'lan'
        ? await runLanChat(args.lan.url, args.lan.model, messages)
        : await runLlamaChat(args.model, messages, args.onToken);
    return makeRun({ ...base, model_id: modelId, output: out.text, load_ms: out.loadMs, latency_ms: out.latencyMs, tokens_per_s: out.tokensPerS, error: null });
  } catch (err) {
    return makeRun({ ...base, model_id: modelId, output: '', load_ms: null, latency_ms: 0, tokens_per_s: null, error: errorMessage(err) });
  }
}
