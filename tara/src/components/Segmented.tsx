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
              isSelected ? 'border-sipag-500 bg-sipag-400' : 'border-banig-300 bg-white'
            }`}
          >
            <Text className={isSelected ? 'font-bold text-tara-900' : 'text-tara-700'}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
