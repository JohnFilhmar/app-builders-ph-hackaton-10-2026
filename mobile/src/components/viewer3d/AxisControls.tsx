import { Pressable, Text, View } from 'react-native';

import { IDENTITY_TRANSFORM, type ModelTransform, type Vec3 } from '@/types/viewer';

type AxisControlsProps = { transform: ModelTransform; onChange: (next: ModelTransform) => void };

const MOVE_STEP = 0.1;
const TURN_STEP = Math.PI / 12;
const AXES = ['X', 'Y', 'Z'] as const;

const nudge = (v: Vec3, axis: number, by: number): Vec3 => v.map((n, i) => (i === axis ? n + by : n)) as Vec3;

function StepButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-9 w-9 items-center justify-center rounded-lg bg-neutral-200 active:bg-neutral-300 dark:bg-neutral-800 dark:active:bg-neutral-700"
    >
      <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{label.startsWith('-') ? '−' : '+'}</Text>
    </Pressable>
  );
}

/** Precise ± nudges for position (0.1 units) and rotation (15°) on each axis, plus reset. */
export function AxisControls({ transform, onChange }: AxisControlsProps) {
  const rows = [
    { kind: 'Move', key: 'position' as const, step: MOVE_STEP, fmt: (n: number) => n.toFixed(2) },
    // display wraps to -180..180 so spins read sensibly; the stored angle stays continuous
    { kind: 'Turn', key: 'rotation' as const, step: TURN_STEP, fmt: (n: number) => `${Math.round(((((n * 180) / Math.PI + 180) % 360) + 360) % 360 - 180)}°` },
  ];
  return (
    <View className="gap-2">
      {rows.map((row) => (
        <View key={row.key} className="flex-row items-center gap-2">
          <Text className="w-10 text-xs font-medium uppercase text-neutral-500">{row.kind}</Text>
          {AXES.map((axis, i) => (
            <View key={axis} className="flex-1 flex-row items-center justify-between gap-1">
              <StepButton label={`-${row.kind} ${axis}`} onPress={() => onChange({ ...transform, [row.key]: nudge(transform[row.key], i, -row.step) })} />
              <Text className="text-xs text-neutral-700 dark:text-neutral-300">
                {axis} {row.fmt(transform[row.key][i] ?? 0)}
              </Text>
              <StepButton label={`+${row.kind} ${axis}`} onPress={() => onChange({ ...transform, [row.key]: nudge(transform[row.key], i, row.step) })} />
            </View>
          ))}
        </View>
      ))}
      <Pressable accessibilityRole="button" onPress={() => onChange(IDENTITY_TRANSFORM)} className="items-center rounded-lg py-2 active:bg-neutral-200 dark:active:bg-neutral-800">
        <Text className="font-medium text-blue-500">Reset position & rotation</Text>
      </Pressable>
    </View>
  );
}
