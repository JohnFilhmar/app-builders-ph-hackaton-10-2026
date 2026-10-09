import { useEffect, useState } from 'react';
import { Image, Text } from 'react-native';
import { models, useTextToImage } from 'react-native-executorch';

import { Button } from '@/components/Button';
import { writeBmp } from '@/lib/image/writeBmp';
import { makeRun } from '@/lib/results/makeRun';
import { releaseLlama } from '@/lib/runtimes/llamaRuntime';
import { useResultsStore } from '@/lib/stores/resultsStore';
import type { Lang } from '@/types/catalog';
import { errorMessage } from '@/utils/errorMessage';

type ImageGeneratorProps = { modelId: string; prompt: string; lang: Lang; onRun: (runId: string) => void };

/** SDXS text-to-image via ExecuTorch. Mounting it downloads and loads the model, so mount only on demand. */
export function ImageGenerator({ modelId, prompt, lang, onRun }: ImageGeneratorProps) {
  const tti = useTextToImage(models.textToImage.SDXS_512_DREAMSHAPER.DEFAULT);
  const addRun = useResultsStore((s) => s.addRun);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // free the resident GGUF first; SDXS plus a VLM together is a likely OOM on 4-6 GB phones
  useEffect(() => {
    void releaseLlama();
  }, []);

  const generate = async () => {
    if (!tti.generate) return;
    setIsGenerating(true);
    const base = { task: 'image_gen' as const, model_id: modelId, target: 'phone' as const, lang, input: prompt.trim(), load_ms: null, tokens_per_s: null, realtime_factor: null };
    try {
      const started = Date.now();
      const image = await tti.generate(prompt.trim());
      const latencyMs = Date.now() - started;
      const path = await writeBmp(image);
      setImagePath(path);
      const run = makeRun({ ...base, output: `${image.width}x${image.height} image`, latency_ms: latencyMs, error: null });
      addRun(run);
      onRun(run.id);
    } catch (err) {
      const run = makeRun({ ...base, output: '', latency_ms: 0, error: errorMessage(err) });
      addRun(run);
      onRun(run.id);
    }
    setIsGenerating(false);
  };

  if (tti.error) return <Text className="text-sm text-red-600">SDXS failed: {tti.error.message}</Text>;
  if (!tti.isReady) return <Text className="text-sm text-neutral-500">Loading SDXS… {Math.round(tti.downloadProgress)}%</Text>;
  return (
    <>
      <Button label="Generate" onPress={() => void generate()} isBusy={isGenerating} disabled={!prompt.trim()} />
      {imagePath ? <Image source={{ uri: `file://${imagePath}` }} className="aspect-square w-full rounded-xl" /> : null}
    </>
  );
}
