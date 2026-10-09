import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  isBusy?: boolean;
};

const VARIANT_CLASSES = {
  primary: 'bg-sipag-500 active:bg-sipag-600',
  secondary: 'bg-banig-200 active:bg-banig-300',
  danger: 'bg-red-600 active:bg-red-700',
} as const;

const LABEL_CLASSES = {
  primary: 'text-tara-900',
  secondary: 'text-tara-900',
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
      className={`min-h-11 flex-row items-center justify-center gap-2 rounded-2xl px-5 py-3.5 ${VARIANT_CLASSES[variant]} ${isInactive ? 'opacity-50' : ''}`}
    >
      {isBusy ? <ActivityIndicator color={variant === 'secondary' ? undefined : 'white'} /> : null}
      <Text className={`font-bold text-base ${LABEL_CLASSES[variant]}`}>{label}</Text>
    </Pressable>
  );
}
