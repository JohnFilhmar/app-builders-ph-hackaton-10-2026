import { Pressable, Text, View } from 'react-native';

type SegmentedProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** Small exclusive choice row, used for EN/TL, phone/LAN and mode switches. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const isSelected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(o.value)}
            className={`min-h-9 justify-center rounded-full border px-3.5 py-1.5 ${
              isSelected ? 'border-blue-600 bg-blue-600' : 'border-neutral-300 dark:border-neutral-700'
            }`}
          >
            <Text className={isSelected ? 'font-medium text-white' : 'text-neutral-800 dark:text-neutral-200'}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
