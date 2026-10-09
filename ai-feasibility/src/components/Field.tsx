import { Text, TextInput, View, type TextInputProps } from 'react-native';

type FieldProps = Omit<TextInputProps, 'className'> & { label: string };

/** Labelled text input. */
export function Field({ label, multiline, ...inputProps }: FieldProps) {
  return (
    <View className="gap-1">
      <Text className="text-xs font-medium uppercase text-neutral-500">{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor="#9ca3af"
        className={`rounded-xl border border-neutral-300 px-3 py-2.5 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-100 ${multiline ? 'min-h-24' : ''}`}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
