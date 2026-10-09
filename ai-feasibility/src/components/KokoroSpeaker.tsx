import { useState } from 'react';
import { Text } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { models, useTextToSpeech } from 'react-native-executorch';

import { Button } from '@/components/Button';
import { playAudioFile } from '@/lib/audio/playAudioFile';
import { float32ToPcm16, pcm16ToWav } from '@/lib/audio/wav';
import { makeRun } from '@/lib/results/makeRun';
import { useResultsStore } from '@/lib/stores/resultsStore';
import type { Lang } from '@/types/catalog';
import { bytesToBase64 } from '@/utils/base64';
import { errorMessage } from '@/utils/errorMessage';

type KokoroSpeakerProps = { modelId: string; text: string; lang: Lang; onRun: (runId: string) => void };

/** Kokoro TTS via ExecuTorch. Mounting it starts the model download/load, so mount only on demand. */
export function KokoroSpeaker({ modelId, text, lang, onRun }: KokoroSpeakerProps) {
  const tts = useTextToSpeech(models.textToSpeech.KOKORO.EN_US.DEFAULT);
  const addRun = useResultsStore((s) => s.addRun);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = async () => {
    if (!tts.synthesize) return;
    setIsSpeaking(true);
    const base = { task: 'tts' as const, model_id: modelId, target: 'phone' as const, lang, input: text, load_ms: null, tokens_per_s: null };
    try {
      const started = Date.now();
      const chunks: Float32Array[] = [];
      let sampleRate = 24000;
      for await (const chunk of tts.synthesize(text, { voice: 'af_heart' })) {
        chunks.push(chunk.audio);
        sampleRate = chunk.sampleRate;
      }
      const latencyMs = Date.now() - started;
      const total = chunks.reduce((n, c) => n + c.length, 0);
      const samples = new Float32Array(total);
      let offset = 0;
      for (const c of chunks) {
        samples.set(c, offset);
        offset += c.length;
      }
      const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/tts-${Date.now()}.wav`;
      await ReactNativeBlobUtil.fs.writeFile(path, bytesToBase64(pcm16ToWav(float32ToPcm16(samples), sampleRate)), 'base64');
      playAudioFile(path);
      const seconds = total / sampleRate;
      const run = makeRun({ ...base, output: `${seconds.toFixed(1)}s audio`, latency_ms: latencyMs, realtime_factor: seconds / Math.max(latencyMs / 1000, 0.001), error: null });
      addRun(run);
      onRun(run.id);
    } catch (err) {
      const run = makeRun({ ...base, output: '', latency_ms: 0, realtime_factor: null, error: errorMessage(err) });
      addRun(run);
      onRun(run.id);
    }
    setIsSpeaking(false);
  };

  if (tts.error) return <Text className="text-sm text-red-600">Kokoro failed: {tts.error.message}</Text>;
  if (!tts.isReady) return <Text className="text-sm text-neutral-500">Loading Kokoro… {Math.round(tts.downloadProgress)}%</Text>;
  return <Button label="Speak with Kokoro" onPress={() => void speak()} isBusy={isSpeaking} disabled={!text.trim()} />;
}
