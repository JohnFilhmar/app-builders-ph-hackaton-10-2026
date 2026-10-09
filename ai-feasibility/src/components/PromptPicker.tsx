import { Pressable, Text, View } from 'react-native';

import { useCatalog } from '@/hooks/useCatalog';
import type { Lang, Task } from '@/types/catalog';

type PromptPickerProps = { task: Task; lang: Lang; onPick: (prompt: string) => void };

/** Tappable sample prompts from the catalog for one task and language, so every phone runs the same inputs. */
export function PromptPicker({ task, lang, onPick }: PromptPickerProps) {
  const { catalog } = useCatalog();
  const prompts = catalog.prompts[task]?.[lang] ?? [];
  if (prompts.length === 0) return null;
  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase text-neutral-500">Sample prompts ({lang.toUpperCase()})</Text>
      {prompts.map((p) => (
        <Pressable
          key={p}
          onPress={() => onPick(p)}
          className="rounded-xl bg-neutral-100 px-3 py-2 active:bg-neutral-200 dark:bg-neutral-800 dark:active:bg-neutral-700"
        >
          <Text className="text-sm text-neutral-800 dark:text-neutral-200">{p}</Text>
        </Pressable>
      ))}
    </View>
  );
}
