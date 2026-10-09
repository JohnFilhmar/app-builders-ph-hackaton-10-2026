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

// face, side facet, top highlight and label color per variant: the highlight strip is what makes the tile read as raised
const LOOK = {
  primary: { fill: PALETTE.ink900, depth: PALETTE.tara700, stroke: PALETTE.ink700, shine: PALETTE.ink700, text: 'text-banig-50', ink: PALETTE.sipag400 },
  secondary: { fill: PALETTE.white, depth: PALETTE.banig300, stroke: PALETTE.banig300, shine: PALETTE.banig100, text: 'text-ink-900', ink: PALETTE.ink900 },
  gold: { fill: PALETTE.sipag400, depth: PALETTE.sipag600, stroke: PALETTE.sipag600, shine: PALETTE.sipag300, text: 'text-ink-900', ink: PALETTE.ink900 },
  danger: { fill: '#B3261E', depth: '#7A1A14', stroke: '#7A1A14', shine: '#D2544B', text: 'text-white', ink: PALETTE.white },
} as const;

const DEPTH = 6;

/**
 * The one button: a chamfered polygon tile with a lit top edge and a dark side facet that sinks when pressed. The label
 * is large but light (medium pixel weight), so it reads at arm's length without looking heavy.
 */
export function Button({ label, onPress, variant = 'primary', icon, disabled = false, isBusy = false }: ButtonProps) {
  const look = LOOK[variant];
  const isInactive = disabled || isBusy;
  const trailing = icon === undefined ? (variant === 'primary' ? 'arrow' : null) : icon;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: isInactive }} onPress={onPress} disabled={isInactive}>
      {({ pressed }) => (
        <View style={{ paddingTop: pressed ? DEPTH : 0, opacity: isInactive ? 0.45 : 1 }}>
          <PolyFrame cut={12} fill={look.fill} stroke={look.stroke} depth={pressed ? 0 : DEPTH} depthColor={look.depth}>
            <View className="absolute left-3 right-3 top-1 h-1" style={{ backgroundColor: look.shine }} />
            <View className="min-h-14 flex-row items-center justify-center gap-3 px-5 py-3.5">
              {isBusy ? <ActivityIndicator color={look.ink} /> : null}
              <Text className={`font-pixel text-xl tracking-wide ${look.text}`}>{label}</Text>
              {trailing && !isBusy ? <PixelIcon name={trailing} size={22} color={look.ink} /> : null}
            </View>
          </PolyFrame>
        </View>
      )}
    </Pressable>
  );
}
