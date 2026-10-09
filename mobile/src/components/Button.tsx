import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  isBusy?: boolean;
};

const VARIANT_CLASSES = {
  primary: 'bg-blue-600 active:bg-blue-700',
  secondary: 'bg-neutral-200 active:bg-neutral-300 dark:bg-neutral-800 dark:active:bg-neutral-700',
  danger: 'bg-red-600 active:bg-red-700',
} as const;

const LABEL_CLASSES = {
  primary: 'text-white',
  secondary: 'text-neutral-900 dark:text-neutral-100',
  danger: 'text-white',
} as const;

/** Full-width-friendly action button with a busy spinner. */
export function Button({ label, onPress, variant = 'primary', disabled = false, isBusy = false }: ButtonProps) {
  const isInactive = disabled || isBusy;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isInactive}
      className={`min-h-11 flex-row items-center justify-center gap-2 rounded-xl px-4 py-2.5 ${VARIANT_CLASSES[variant]} ${isInactive ? 'opacity-50' : ''}`}
    >
      {isBusy ? <ActivityIndicator color={variant === 'secondary' ? undefined : 'white'} /> : null}
      <Text className={`font-semibold ${LABEL_CLASSES[variant]}`}>{label}</Text>
    </Pressable>
  );
}
