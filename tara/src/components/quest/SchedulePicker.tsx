import { Pressable, Text, View } from 'react-native';

import { PolyFrame } from '@/components/poly/PolyFrame';
import { useT } from '@/lib/i18n/translate';
import { atTime, formatWhen, type ClockTime } from '@/lib/quests/schedule';
import { PALETTE } from '@/lib/theme/palette';

type SchedulePickerProps = {
  value: number | undefined;
  onChange: (at: number | undefined) => void;
  /** the user's usual time for this kind of quest, offered first when known */
  usual: ClockTime | null;
};

const STEP_MS = 15 * 60_000;

function Chip({ label, isPicked, onPress }: { label: string; isPicked: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: isPicked }} onPress={onPress}>
      <PolyFrame cut={7} fill={isPicked ? PALETTE.sipag400 : PALETTE.white} stroke={isPicked ? PALETTE.sipag600 : PALETTE.banig300}>
        <Text className="px-3 py-2.5 font-pixel text-sm text-ink-900">{label}</Text>
      </PolyFrame>
    </Pressable>
  );
}

/** When a quest is planned for: anytime, quick picks, the usual time, then 15-minute nudges. A time sets a reminder. */
export function SchedulePicker({ value, onChange, usual }: SchedulePickerProps) {
  const t = useT();
  const now = Date.now();
  const hourFromNow = Math.ceil((now + 60 * 60_000) / STEP_MS) * STEP_MS;
  const picks: { label: string; at: number | undefined }[] = [
    { label: t('Anytime', 'Kahit kailan'), at: undefined },
    ...(usual ? [{ label: t('Usual time', 'Karaniwang oras'), at: atTime(undefined, usual, now) }] : []),
    { label: t('In 1 hour', 'Sa 1 oras'), at: hourFromNow },
    { label: t('Tonight 7 PM', 'Mamayang 7 PM'), at: atTime('today', { hour: 19, minute: 0 }, now) },
    { label: t('Tomorrow 7 AM', 'Bukas 7 AM'), at: atTime('tomorrow', { hour: 7, minute: 0 }, now) },
  ].filter((p) => p.at === undefined || p.at > now);
  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        {picks.map((p) => (
          <Chip key={p.label} label={p.label} isPicked={value === p.at} onPress={() => onChange(p.at)} />
        ))}
      </View>
      {value ? (
        <View className="flex-row items-center justify-between gap-2">
          <Chip label="-15m" isPicked={false} onPress={() => onChange(Math.max(now + STEP_MS, value - STEP_MS))} />
          <Text className="flex-1 text-center font-pixel-bold text-base text-ink-900">{formatWhen(value, now, t)}</Text>
          <Chip label="+15m" isPicked={false} onPress={() => onChange(value + STEP_MS)} />
        </View>
      ) : null}
    </View>
  );
}
