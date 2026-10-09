import { useState } from 'react';

import { ActiveModelBar } from '@/components/ActiveModelBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { PromptPicker } from '@/components/PromptPicker';
import { RunCard } from '@/components/RunCard';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { useActiveModel } from '@/hooks/useCatalog';
import { useModelFiles } from '@/hooks/useModelFiles';
import { useResultsStore } from '@/lib/stores/resultsStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { runTextTask, type TextMode } from '@/lib/tasks/runTextTask';
import type { Lang } from '@/types/catalog';
import type { ExecutionTarget } from '@/types/results';

const MODES = [
  { value: 'chat', label: 'Chat' },
  { value: 'translate', label: 'Translate' },
] as const;
const TARGETS = [
  { value: 'phone', label: 'On phone' },
  { value: 'lan', label: 'LAN laptop' },
] as const;

export default function TextScreen() {
  const [mode, setMode] = useState<TextMode>('chat');
  const [lang, setLang] = useState<Lang>('tl');
  const [target, setTarget] = useState<ExecutionTarget>('phone');
  const [input, setInput] = useState('');
  const [liveText, setLiveText] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const model = useActiveModel(mode);
  const files = useModelFiles(model);
  const lanUrl = useSettingsStore((s) => s.lanUrl);
  const lanModel = useSettingsStore((s) => s.lanModel);
  const addRun = useResultsStore((s) => s.addRun);

  const langOptions =
    mode === 'chat'
      ? ([{ value: 'en', label: 'Reply in EN' }, { value: 'tl', label: 'Reply in TL' }] as const)
      : ([{ value: 'en', label: 'EN → TL' }, { value: 'tl', label: 'TL → EN' }] as const);

  const canRun = Boolean(model) && input.trim().length > 0 && (target === 'lan' || files.state === 'ready');

  const run = async () => {
    if (!model) return;
    setIsRunning(true);
    setRunId(null);
    setLiveText('');
    const result = await runTextTask({ mode, lang, target, model, input: input.trim(), lan: { url: lanUrl, model: lanModel }, onToken: setLiveText });
    addRun(result);
    setRunId(result.id);
    setIsRunning(false);
  };

  return (
    <Screen title="Text" subtitle="Conversation and translation, English and Tagalog">
      <Card>
        <Segmented options={MODES} value={mode} onChange={setMode} />
        <Segmented options={langOptions} value={lang} onChange={setLang} />
        <Segmented options={TARGETS} value={target} onChange={setTarget} />
        {target === 'phone' ? <ActiveModelBar task={mode} /> : null}
      </Card>
      <Card>
        <PromptPicker task={mode} lang={lang} onPick={setInput} />
        <Field label="Prompt" value={input} onChangeText={setInput} multiline />
        <Button label={isRunning ? 'Running…' : 'Run'} onPress={() => void run()} disabled={!canRun} isBusy={isRunning} />
      </Card>
      {runId || liveText ? (
        <Card title="Output">
          <RunCard runId={runId} liveText={liveText} />
        </Card>
      ) : null}
    </Screen>
  );
}
