import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { PixelIcon, type PixelIconName } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { PALETTE } from '@/lib/theme/palette';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'gold' | 'danger';
  /** trailing icon; primary buttons default to the arrow */
  icon?: PixelIconName | null;
  disabled?: boolean;
  isBusy?: boolean;
};

const LOOK = {
  primary: { fill: PALETTE.ink900, depth: PALETTE.tara700, stroke: undefined, text: 'text-banig-50', ink: PALETTE.banig50 },
  secondary: { fill: PALETTE.white, depth: PALETTE.banig300, stroke: PALETTE.banig300, text: 'text-ink-900', ink: PALETTE.ink900 },
  gold: { fill: PALETTE.sipag400, depth: PALETTE.sipag600, stroke: undefined, text: 'text-ink-900', ink: PALETTE.ink900 },
  danger: { fill: '#B3261E', depth: '#7A1A14', stroke: undefined, text: 'text-white', ink: PALETTE.white },
} as const;

const DEPTH = 4;

/**
 * The one button: a chamfered polygon tile with a darker side facet that sinks when pressed, a pixel-font label and
 * an optional pixel icon. Full width by default, at least 52 dp tall.
 */
export function Button({ label, onPress, variant = 'primary', icon, disabled = false, isBusy = false }: ButtonProps) {
  const look = LOOK[variant];
  const isInactive = disabled || isBusy;
  const trailing = icon === undefined ? (variant === 'primary' ? 'arrow' : null) : icon;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: isInactive }} onPress={onPress} disabled={isInactive}>
      {({ pressed }) => (
        <View style={{ paddingTop: pressed ? DEPTH : 0, opacity: isInactive ? 0.45 : 1 }}>
          <PolyFrame cut={10} fill={look.fill} stroke={look.stroke} depth={pressed ? 0 : DEPTH} depthColor={look.depth}>
            <View className="min-h-12 flex-row items-center justify-center gap-2.5 px-5 py-3.5">
              {isBusy ? <ActivityIndicator color={look.ink} /> : null}
              <Text className={`font-pixel-bold text-lg ${look.text}`}>{label}</Text>
              {trailing && !isBusy ? <PixelIcon name={trailing} size={18} color={look.ink} /> : null}
            </View>
          </PolyFrame>
        </View>
      )}
    </Pressable>
  );
}
