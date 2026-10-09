import * as Device from 'expo-device';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { ModelRow } from '@/components/ModelRow';
import { Screen } from '@/components/Screen';
import { useActiveModel, useCatalog } from '@/hooks/useCatalog';
import { useResultsStore } from '@/lib/stores/resultsStore';
import { useSettingsStore } from '@/lib/stores/settingsStore';
import { TASKS, type Task } from '@/types/catalog';

const TASK_LABEL: Record<Task, string> = {
  chat: 'Chat (Text tab)',
  translate: 'Translate (Text tab)',
  stt: 'Speech to text (Voice tab)',
  tts: 'Text to speech (Voice tab)',
  describe: 'Describe image (Vision tab)',
  image_gen: 'Generate image (Vision tab)',
};

function TaskModels({ task }: { task: Task }) {
  const { catalog } = useCatalog();
  const active = useActiveModel(task);
  const setActiveModel = useSettingsStore((s) => s.setActiveModel);
  return (
    <Card title={TASK_LABEL[task]}>
      {catalog.models
        .filter((m) => m.tasks.includes(task))
        .map((m) => (
          <ModelRow key={m.id} model={m} isActive={m.id === active?.id} onUse={() => setActiveModel(task, m.id)} />
        ))}
    </Card>
  );
}

export default function ModelsScreen() {
  const { catalog, source, error, isFetching, refetch } = useCatalog();
  const settings = useSettingsStore();
  const unsynced = useResultsStore((s) => s.unsynced.length);
  const resync = useResultsStore((s) => s.resync);
  const [backendUrl, setBackendUrl] = useState(settings.backendUrl);
  const [lanUrl, setLanUrl] = useState(settings.lanUrl);
  const [lanModel, setLanModel] = useState(settings.lanModel);
  // the persisted store hydrates after first render, so refresh the editable copies once it does
  useEffect(() => {
    setBackendUrl(settings.backendUrl);
    setLanUrl(settings.lanUrl);
    setLanModel(settings.lanModel);
  }, [settings.backendUrl, settings.lanUrl, settings.lanModel]);
  const ramGb = Device.totalMemory ? (Device.totalMemory / 1024 ** 3).toFixed(1) : '?';

  return (
    <Screen title="Models" subtitle={`${Device.manufacturer ?? ''} ${Device.modelName ?? ''} · ${ramGb} GB RAM`}>
      <Card title="Catalog backend">
        <Field label="Backend URL" value={backendUrl} onChangeText={setBackendUrl} autoCapitalize="none" keyboardType="url" />
        <Button
          label="Save & reload catalog"
          isBusy={isFetching}
          onPress={() => {
            settings.setBackendUrl(backendUrl);
            refetch();
          }}
        />
        <Text className="text-xs text-neutral-500">
          Catalog {catalog.version} from {source}
          {error ? ` (backend: ${error})` : ''}. Results table: {settings.backendUrl}/results
        </Text>
        {unsynced > 0 ? <Button label={`Resend ${unsynced} unsynced results`} variant="secondary" onPress={() => void resync()} /> : null}
      </Card>

      <Card title="LAN model server (optional)">
        <Text className="text-xs text-neutral-500">
          OpenAI-compatible server on a laptop for comparison, e.g. llama-server on :8080 or Ollama on :11434. Text tasks only.
        </Text>
        <Field label="Server URL" value={lanUrl} onChangeText={setLanUrl} autoCapitalize="none" keyboardType="url" placeholder="http://192.168.1.10:8080" />
        <Field label="Model name" value={lanModel} onChangeText={setLanModel} autoCapitalize="none" placeholder="gemma3:1b (Ollama only)" />
        <Button label="Save LAN server" variant="secondary" onPress={() => settings.setLan(lanUrl, lanModel)} />
      </Card>

      {TASKS.map((task) => (
        <TaskModels key={task} task={task} />
      ))}
    </Screen>
  );
}
