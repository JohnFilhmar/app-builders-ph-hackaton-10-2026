import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useModelFiles } from '@/hooks/useModelFiles';
import type { CatalogModel } from '@/types/catalog';

type ModelRowProps = { model: CatalogModel; isActive: boolean; onUse: () => void };

const STATE_LABEL = {
  unknown: 'checking…',
  missing: 'not downloaded',
  downloading: 'downloading',
  verifying: 'verifying sha256…',
  ready: 'ready',
  error: 'error',
} as const;

/** One candidate model for a task: size, languages, licence, file status and actions. */
export function ModelRow({ model, isActive, onUse }: ModelRowProps) {
  const files = useModelFiles(model);
  const sizeMb = model.files.reduce((n, f) => n + f.size_bytes, 0) / 1e6;
  const isBusy = files.state === 'downloading' || files.state === 'verifying';

  return (
    <View className={`gap-2 rounded-xl border p-3 ${isActive ? 'border-blue-600' : 'border-neutral-200 dark:border-neutral-800'}`}>
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: isActive }} onPress={onUse} className="gap-1">
        <Text className="font-semibold text-neutral-900 dark:text-neutral-50">
          {isActive ? '● ' : '○ '}
          {model.label}
        </Text>
        <Text className="text-xs text-neutral-500">
          {model.files.length > 0 ? `${sizeMb.toFixed(0)} MB` : 'no files to fetch here'} · {model.languages.join('/').toUpperCase()} ·{' '}
          {model.license}
        </Text>
        {model.notes ? <Text className="text-xs text-neutral-500">{model.notes}</Text> : null}
      </Pressable>
      <Text className={`text-xs font-medium ${files.state === 'error' ? 'text-red-600' : files.state === 'ready' ? 'text-green-600' : 'text-neutral-600'}`}>
        {files.isSelfManaged ? 'managed by runtime' : STATE_LABEL[files.state]}
        {files.state === 'downloading' ? ` ${Math.round(files.progress * 100)}%` : ''}
        {files.error ? `: ${files.error}` : ''}
      </Text>
      {files.isSelfManaged ? null : (
        <View className="flex-row gap-2">
          {files.state === 'ready' ? (
            <Button label="Delete" variant="secondary" onPress={files.remove} />
          ) : (
            <Button label={files.state === 'error' ? 'Retry download' : 'Download'} onPress={files.download} isBusy={isBusy} />
          )}
        </View>
      )}
    </View>
  );
}
