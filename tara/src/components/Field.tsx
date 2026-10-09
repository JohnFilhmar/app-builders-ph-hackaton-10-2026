import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { PolyFrame } from '@/components/poly/PolyFrame';
import { PALETTE } from '@/lib/theme/palette';

type FieldProps = Omit<TextInputProps, 'className'> & { label: string };

/** Labelled text input in a chamfered frame. */
export function Field({ label, multiline, ...inputProps }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="font-pixel text-sm text-tara-700">{label}</Text>
      <PolyFrame cut={8} fill={PALETTE.white} stroke={PALETTE.banig300}>
        <TextInput
          {...inputProps}
          multiline={multiline}
          placeholderTextColor={PALETTE.tara300}
          selectionColor={PALETTE.sipag500}
          cursorColor={PALETTE.ink900}
          className={`px-3.5 py-3 text-base text-ink-900 ${multiline ? 'min-h-28' : 'min-h-12'}`}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </PolyFrame>
    </View>
  );
}
