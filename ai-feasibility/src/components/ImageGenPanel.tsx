import { useState } from 'react';
import { Text } from 'react-native';

import { ActiveModelBar } from '@/components/ActiveModelBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { ImageGenerator } from '@/components/ImageGenerator';
import { PromptPicker } from '@/components/PromptPicker';
import { RunCard } from '@/components/RunCard';
import { Segmented } from '@/components/Segmented';
import { useActiveModel } from '@/hooks/useCatalog';
import type { Lang } from '@/types/catalog';

const LANGS = [
  { value: 'en', label: 'Prompt in EN' },
  { value: 'tl', label: 'Prompt in TL' },
] as const;

/** Optional text-to-image test. The heavy model loads only after an explicit tap. */
export function ImageGenPanel() {
  const [lang, setLang] = useState<Lang>('en');
  const [prompt, setPrompt] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const model = useActiveModel('image_gen');

  return (
    <Card title="Generate an image (optional, heavy)">
      <ActiveModelBar task="image_gen" />
      <Segmented options={LANGS} value={lang} onChange={setLang} />
      <PromptPicker task="image_gen" lang={lang} onPick={setPrompt} />
      <Field label="Prompt" value={prompt} onChangeText={setPrompt} />
      {!model ? (
        <Text className="text-sm text-neutral-500">No image model in the catalog.</Text>
      ) : isLoaded ? (
        <ImageGenerator modelId={model.id} prompt={prompt} lang={lang} onRun={setRunId} />
      ) : (
        <Button label="Load image model (frees the text model)" variant="secondary" onPress={() => setIsLoaded(true)} />
      )}
      {runId ? <RunCard runId={runId} /> : null}
    </Card>
  );
}
