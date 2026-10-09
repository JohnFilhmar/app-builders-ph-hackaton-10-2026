import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Text } from 'react-native';

import { ActiveModelBar } from '@/components/ActiveModelBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { KokoroSpeaker } from '@/components/KokoroSpeaker';
import { PromptPicker } from '@/components/PromptPicker';
import { RunCard } from '@/components/RunCard';
import { Segmented } from '@/components/Segmented';
import { useActiveModel } from '@/hooks/useCatalog';
import { makeRun } from '@/lib/results/makeRun';
import { useResultsStore } from '@/lib/stores/resultsStore';
import type { Lang } from '@/types/catalog';

const LANGS = [
  { value: 'tl', label: 'Tagalog' },
  { value: 'en', label: 'English' },
] as const;

/** Speak text with the active TTS model: phone system voice (has fil-PH) or Kokoro (English only). */
export function TextToSpeechPanel() {
  const [lang, setLang] = useState<Lang>('tl');
  const [text, setText] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [isKokoroLoaded, setIsKokoroLoaded] = useState(false);
  const model = useActiveModel('tts');
  const addRun = useResultsStore((s) => s.addRun);

  const speakWithSystem = () => {
    if (!model) return;
    const started = Date.now();
    let firstAudioMs = 0;
    Speech.speak(text, {
      language: lang === 'tl' ? 'fil-PH' : 'en-US',
      onStart: () => {
        firstAudioMs = Date.now() - started;
      },
      onDone: () => {
        const run = makeRun({ task: 'tts', model_id: model.id, target: 'phone', lang, input: text, output: `spoke in ${((Date.now() - started) / 1000).toFixed(1)}s`, load_ms: null, latency_ms: firstAudioMs, tokens_per_s: null, realtime_factor: null, error: null });
        addRun(run);
        setRunId(run.id);
      },
      onError: (err) => {
        const run = makeRun({ task: 'tts', model_id: model.id, target: 'phone', lang, input: text, output: '', load_ms: null, latency_ms: 0, tokens_per_s: null, realtime_factor: null, error: err.message });
        addRun(run);
        setRunId(run.id);
      },
    });
  };

  return (
    <Card title="Text to speech">
      <ActiveModelBar task="tts" />
      <Segmented options={LANGS} value={lang} onChange={setLang} />
      <PromptPicker task="tts" lang={lang} onPick={setText} />
      <Field label="Text" value={text} onChangeText={setText} multiline />
      {model?.runtime === 'kokoro' ? (
        <>
          {lang === 'tl' ? <Text className="text-xs text-amber-600">Kokoro has no Tagalog voice; expect English phonemes.</Text> : null}
          {isKokoroLoaded ? (
            <KokoroSpeaker modelId={model.id} text={text} lang={lang} onRun={setRunId} />
          ) : (
            <Button label="Load Kokoro (downloads on first use)" variant="secondary" onPress={() => setIsKokoroLoaded(true)} />
          )}
        </>
      ) : (
        <Button label="Speak (system voice)" onPress={speakWithSystem} disabled={!text.trim() || !model} />
      )}
      {runId ? <RunCard runId={runId} /> : null}
    </Card>
  );
}
