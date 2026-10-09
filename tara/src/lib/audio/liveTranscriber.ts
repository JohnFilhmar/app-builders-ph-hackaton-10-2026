import { activeModel } from '@/lib/ai/activeModel';
import { discardAudio, drainMic, startMic, stopMic } from '@/lib/audio/micRecorder';
import { transcribeWav } from '@/lib/runtimes/whisperRuntime';
import type { Lang } from '@/types/chat';

const SLICE_MS = 4000;

export type LiveTranscription = {
  /** stops listening and resolves with the full transcript once the last slice is done */
  stop: () => Promise<{ text: string; seconds: number }>;
};

/**
 * Listens while the hold-to-talk button is held and transcribes in short slices, so words show up while the user
 * is still talking. Slices run one at a time on the chosen "ears" model, and each audio slice is deleted right after.
 * @param lang language hint ('auto' lets the model decide)
 * @param onText receives the transcript so far after each slice
 * @param prompt optional vocabulary hint, e.g. counting words
 */
export function startLiveTranscription(lang: Lang | 'auto', onText: (textSoFar: string) => void, prompt?: string): LiveTranscription {
  const model = activeModel('ears');
  const parts: string[] = [];
  let seconds = 0;
  let queue: Promise<void> = Promise.resolve();

  const enqueue = (slice: Promise<{ wavPath: string; seconds: number }>) => {
    queue = queue.then(async () => {
      const { wavPath, seconds: sliceSeconds } = await slice;
      seconds += sliceSeconds;
      try {
        if (sliceSeconds >= 0.4) {
          const out = await transcribeWav(model, wavPath, lang, prompt);
          if (out.text && !/^\[.*\]$/.test(out.text)) parts.push(out.text);
          onText(parts.join(' '));
        }
      } finally {
        await discardAudio(wavPath);
      }
    });
  };

  startMic();
  const timer = setInterval(() => enqueue(drainMic()), SLICE_MS);

  return {
    stop: async () => {
      clearInterval(timer);
      enqueue(stopMic());
      await queue;
      return { text: parts.join(' '), seconds };
    },
  };
}
