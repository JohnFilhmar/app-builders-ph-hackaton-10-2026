import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { ActiveModelBar } from '@/components/ActiveModelBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { PromptPicker } from '@/components/PromptPicker';
import { RunCard } from '@/components/RunCard';
import { Segmented } from '@/components/Segmented';
import { useActiveModel } from '@/hooks/useCatalog';
import { useModelFiles } from '@/hooks/useModelFiles';
import { makeRun } from '@/lib/results/makeRun';
import { runLlamaChat } from '@/lib/runtimes/llamaRuntime';
import { useResultsStore } from '@/lib/stores/resultsStore';
import type { Lang } from '@/types/catalog';
import { errorMessage } from '@/utils/errorMessage';

const LANGS = [
  { value: 'en', label: 'Ask in EN' },
  { value: 'tl', label: 'Ask in TL' },
] as const;

const PICK_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };

/** Pick or take a photo and describe it with the active vision GGUF + mmproj. */
export function DescribeImagePanel() {
  const [lang, setLang] = useState<Lang>('en');
  const [prompt, setPrompt] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [liveText, setLiveText] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const model = useActiveModel('describe');
  const files = useModelFiles(model);
  const addRun = useResultsStore((s) => s.addRun);

  const pick = async (fromCamera: boolean) => {
    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
    }
    const result = fromCamera ? await ImagePicker.launchCameraAsync(PICK_OPTIONS) : await ImagePicker.launchImageLibraryAsync(PICK_OPTIONS);
    const uri = result.canceled ? null : (result.assets[0]?.uri ?? null);
    if (uri) {
      setImageUri(uri);
      setRunId(null);
    }
  };

  const run = async () => {
    if (!model || !imageUri) return;
    setIsRunning(true);
    setRunId(null);
    setLiveText('');
    const base = { task: 'describe' as const, model_id: model.id, target: 'phone' as const, lang, input: prompt.trim(), realtime_factor: null };
    try {
      const out = await runLlamaChat(model, [{ role: 'user', content: prompt.trim() }], setLiveText, imageUri);
      const result = makeRun({ ...base, output: out.text, load_ms: out.loadMs, latency_ms: out.latencyMs, tokens_per_s: out.tokensPerS, error: null });
      addRun(result);
      setRunId(result.id);
    } catch (err) {
      const result = makeRun({ ...base, output: '', load_ms: null, latency_ms: 0, tokens_per_s: null, error: errorMessage(err) });
      addRun(result);
      setRunId(result.id);
    }
    setIsRunning(false);
  };

  return (
    <Card title="Describe / recognize an image">
      <ActiveModelBar task="describe" />
      <View className="flex-row gap-2">
        <Button label="Take photo" variant="secondary" onPress={() => void pick(true)} />
        <Button label="Pick photo" variant="secondary" onPress={() => void pick(false)} />
      </View>
      {imageUri ? <Image source={{ uri: imageUri }} className="h-56 w-full rounded-xl" resizeMode="cover" /> : null}
      <Segmented options={LANGS} value={lang} onChange={setLang} />
      <PromptPicker task="describe" lang={lang} onPick={setPrompt} />
      <Field label="Question" value={prompt} onChangeText={setPrompt} />
      <Button
        label="Describe"
        onPress={() => void run()}
        isBusy={isRunning}
        disabled={!imageUri || !prompt.trim() || files.state !== 'ready'}
      />
      {runId || liveText ? <RunCard runId={runId} liveText={liveText} /> : null}
    </Card>
  );
}
