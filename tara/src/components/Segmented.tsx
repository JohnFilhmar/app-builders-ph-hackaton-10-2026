import { Pressable, Text, View } from 'react-native';

import { PixelIcon, type PixelIconName } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { PALETTE } from '@/lib/theme/palette';

type SegmentedProps<T extends string> = {
  options: readonly { value: T; label: string; icon?: PixelIconName }[];
  value: T;
  onChange: (value: T) => void;
};

/** Exclusive choice as polygon chips: gold when picked, paper otherwise. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const isSelected = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ checked: isSelected }} onPress={() => onChange(o.value)}>
            <PolyFrame cut={7} fill={isSelected ? PALETTE.sipag400 : PALETTE.white} stroke={isSelected ? PALETTE.sipag600 : PALETTE.banig300}>
              <View className="min-h-11 flex-row items-center gap-1.5 px-3.5 py-2">
                {o.icon ? <PixelIcon name={o.icon} size={16} color={PALETTE.ink900} /> : null}
                <Text className="font-pixel text-base text-ink-900">{o.label}</Text>
              </View>
            </PolyFrame>
          </Pressable>
        );
      })}
    </View>
  );
}
