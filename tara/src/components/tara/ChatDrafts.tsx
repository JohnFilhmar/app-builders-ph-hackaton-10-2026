import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import type { PlannedDraft } from '@/lib/chat/planQuests';
import { useT } from '@/lib/i18n/translate';
import { QUEST_ICON, questName } from '@/lib/quests/questLook';
import { formatWhen } from '@/lib/quests/schedule';
import { PALETTE } from '@/lib/theme/palette';

const TIME_CHIPS = ['6:00 am', '7:00 am', '5:00 pm', '7:00 pm'];

type ChatDraftsProps = {
  drafts: PlannedDraft[];
  status: 'pending' | 'added';
  onRemove: (index: number) => void;
  /** a quick time answer, sent as if the user typed it */
  onPickTime: (time: string) => void;
  onConfirm: () => void;
};

/**
 * Quest cards Tara drafted from chat. While pending: remove any card, answer "what time?" with a chip, then confirm.
 * Nothing is added until the user confirms.
 */
export function ChatDrafts({ drafts, status, onRemove, onPickTime, onConfirm }: ChatDraftsProps) {
  const t = useT();
  const isPending = status === 'pending';
  const needsTime = drafts.some((d) => d.needs_time);
  return (
    <View className="mt-2 w-full gap-2">
      {drafts.map((d, i) => (
        <PolyFrame key={`${d.title}-${i}`} cut={8} fill={isPending ? PALETTE.white : PALETTE.leaf100} stroke={d.needs_time ? PALETTE.sipag500 : PALETTE.banig300}>
          <View className="flex-row items-center gap-2.5 px-3 py-2.5">
            <PixelIcon name={QUEST_ICON[d.quest_type]} size={20} color={PALETTE.tara500} />
            <View className="flex-1">
              <Text className="text-base font-bold text-ink-900">{d.title}</Text>
              <Text className="text-sm text-tara-700">
                {questName(d.quest_type, t)} · {d.planned_minutes} min
                {d.scheduled_at ? ` · ${formatWhen(d.scheduled_at, Date.now(), t)}` : d.needs_time ? ` · ${t('time?', 'anong oras?')}` : ''}
              </Text>
            </View>
            {isPending ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('Remove', 'Alisin')} onPress={() => onRemove(i)} className="h-11 w-9 items-center justify-center">
                <Text className="font-pixel-bold text-lg text-tara-500">x</Text>
              </Pressable>
            ) : null}
          </View>
        </PolyFrame>
      ))}
      {isPending && needsTime ? (
        <View className="flex-row flex-wrap gap-2">
          {TIME_CHIPS.map((c) => (
            <Pressable key={c} accessibilityRole="button" onPress={() => onPickTime(c)}>
              <PolyFrame cut={6} fill={PALETTE.sipag300} stroke={PALETTE.sipag600}>
                <Text className="px-3 py-2 font-pixel text-sm text-ink-900">{c}</Text>
              </PolyFrame>
            </Pressable>
          ))}
        </View>
      ) : null}
      {isPending && !needsTime ? (
        <Button label={drafts.length > 1 ? t(`Add ${drafts.length} quests`, `Idagdag ang ${drafts.length}`) : t('Add quest', 'Idagdag')} icon="plus" onPress={onConfirm} />
      ) : null}
    </View>
  );
}
