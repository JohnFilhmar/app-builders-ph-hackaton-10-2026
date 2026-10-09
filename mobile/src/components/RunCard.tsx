import { Pressable, Text, View } from 'react-native';

import { useResultsStore } from '@/lib/stores/resultsStore';

type RunCardProps = { runId: string | null; liveText?: string };

const fmt = (n: number | null, unit: string, digits = 0) => (n === null ? null : `${n.toFixed(digits)} ${unit}`);

/** Output, timing metrics and the 1-5 human quality score for one run. Shows streaming text while running. */
export function RunCard({ runId, liveText }: RunCardProps) {
  const run = useResultsStore((s) => s.runs.find((r) => r.id === runId));
  const setScore = useResultsStore((s) => s.setScore);

  if (!run) {
    return liveText ? <Text className="text-base text-neutral-800 dark:text-neutral-200">{liveText}</Text> : null;
  }

  const metrics = [
    fmt(run.load_ms, 'ms load'),
    fmt(run.latency_ms, 'ms run'),
    fmt(run.tokens_per_s, 'tok/s', 1),
    run.realtime_factor === null ? null : `${run.realtime_factor.toFixed(2)}x realtime`,
  ].filter(Boolean);

  return (
    <View className="gap-3">
      {run.error ? (
        <Text className="text-sm text-red-600">{run.error}</Text>
      ) : (
        <Text selectable className="text-base text-neutral-900 dark:text-neutral-100">
          {run.output || '(empty output)'}
        </Text>
      )}
      <Text className="text-xs text-neutral-500">
        {run.model_id} · {run.target} · {run.lang.toUpperCase()} · {metrics.join(' · ')}
      </Text>
      {run.error ? null : (
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-medium uppercase text-neutral-500">Quality</Text>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`Score ${n}`}
              onPress={() => setScore(run.id, n)}
              className={`h-9 w-9 items-center justify-center rounded-full ${run.score === n ? 'bg-blue-600' : 'bg-neutral-200 dark:bg-neutral-800'}`}
            >
              <Text className={run.score === n ? 'font-bold text-white' : 'text-neutral-800 dark:text-neutral-200'}>{n}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
