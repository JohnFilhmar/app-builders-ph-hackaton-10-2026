import { requestRecordingPermissionsAsync } from 'expo-audio';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ActiveModelBar } from '@/components/ActiveModelBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PromptPicker } from '@/components/PromptPicker';
import { RunCard } from '@/components/RunCard';
import { Segmented } from '@/components/Segmented';
import { useActiveModel, useCatalog } from '@/hooks/useCatalog';
import { useModelFiles } from '@/hooks/useModelFiles';
import { startMic, stopMic } from '@/lib/audio/micRecorder';
import { matchCommand } from '@/lib/commands/matchCommand';
import { makeRun } from '@/lib/results/makeRun';
import { transcribeWav } from '@/lib/runtimes/whisperRuntime';
import { useResultsStore } from '@/lib/stores/resultsStore';
import type { Lang } from '@/types/catalog';
import { errorMessage } from '@/utils/errorMessage';

type SttLang = Lang | 'auto';

const LANGS = [
  { value: 'tl', label: 'Tagalog' },
  { value: 'en', label: 'English' },
  { value: 'auto', label: 'Auto-detect' },
] as const;

/** Record, transcribe with the active whisper model, and match voice commands in EN or TL. */
export function SpeechToTextPanel() {
  const [lang, setLang] = useState<SttLang>('tl');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const { catalog } = useCatalog();
  const model = useActiveModel('stt');
  const files = useModelFiles(model);
  const addRun = useResultsStore((s) => s.addRun);

  const start = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setPermissionError('Microphone permission denied');
      return;
    }
    setPermissionError(null);
    setRunId(null);
    setIntent(null);
    startMic();
    setIsRecording(true);
  };

  const stop = async () => {
    if (!model) return;
    setIsRecording(false);
    setIsTranscribing(true);
    const { wavPath, seconds } = await stopMic();
    const runLang: Lang = lang === 'auto' ? 'tl' : lang;
    const base = { task: 'stt' as const, model_id: model.id, target: 'phone' as const, lang: runLang, input: `${seconds.toFixed(1)}s audio (${lang})`, tokens_per_s: null };
    try {
      if (seconds < 0.3) throw new Error(`Microphone captured ${seconds.toFixed(1)}s of audio; nothing to transcribe`);
      const out = await transcribeWav(model, wavPath, lang);
      const run = makeRun({ ...base, output: out.text, load_ms: out.loadMs, latency_ms: out.latencyMs, realtime_factor: seconds / Math.max(out.latencyMs / 1000, 0.001), error: null });
      addRun(run);
      setRunId(run.id);
      setIntent(matchCommand(out.text, catalog.commands));
    } catch (err) {
      const run = makeRun({ ...base, output: '', load_ms: null, latency_ms: 0, realtime_factor: null, error: errorMessage(err) });
      addRun(run);
      setRunId(run.id);
    }
    setIsTranscribing(false);
  };

  return (
    <Card title="Speech to text + voice commands">
      <ActiveModelBar task="stt" />
      <Segmented options={LANGS} value={lang} onChange={setLang} />
      <PromptPicker task="stt" lang={lang === 'auto' ? 'tl' : lang} onPick={() => undefined} />
      <Text className="text-xs text-neutral-500">Read a sample aloud, or say a command like "kumuha ng litrato" or "translate".</Text>
      <Button
        label={isRecording ? 'Stop & transcribe' : 'Start recording'}
        variant={isRecording ? 'danger' : 'primary'}
        onPress={() => void (isRecording ? stop() : start())}
        disabled={files.state !== 'ready'}
        isBusy={isTranscribing}
      />
      {permissionError ? <Text className="text-sm text-red-600">{permissionError}</Text> : null}
      {runId ? (
        <View className="gap-2">
          <RunCard runId={runId} />
          <Text className="text-sm text-neutral-700 dark:text-neutral-300">Command: {intent ?? 'none matched'}</Text>
        </View>
      ) : null}
    </Card>
  );
}
