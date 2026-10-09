import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { useActiveModel } from '@/hooks/useCatalog';
import { useModelFiles } from '@/hooks/useModelFiles';
import type { Task } from '@/types/catalog';

type ActiveModelBarProps = { task: Task };

/** Shows which model a task will use and whether its files are on the phone. */
export function ActiveModelBar({ task }: ActiveModelBarProps) {
  const model = useActiveModel(task);
  const files = useModelFiles(model);
  const isReady = files.state === 'ready';
  return (
    <View className="flex-row items-center justify-between gap-2 rounded-xl bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
      <Text className="flex-1 text-sm text-neutral-800 dark:text-neutral-200" numberOfLines={1}>
        {model?.label ?? 'No model assigned'}
      </Text>
      {isReady ? (
        <Text className="text-xs font-medium text-green-600">ready</Text>
      ) : (
        <Text accessibilityRole="link" onPress={() => router.navigate('/')} className="text-xs font-medium text-blue-500">
          {files.state === 'downloading' ? `${Math.round(files.progress * 100)}%` : 'download on Models tab'}
        </Text>
      )}
    </View>
  );
}
