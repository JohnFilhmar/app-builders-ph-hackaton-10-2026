import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { HoldToTalk } from '@/components/quest/HoldToTalk';
import { scoreReading } from '@/lib/checks/scoring';
import { useT } from '@/lib/i18n/translate';
import type { Passage } from '@/lib/quests/questTypes';
import type { CheckOutcome } from '@/types/quest';

type ReadAloudProofProps = { passage: Passage; onResult: (outcome: CheckOutcome) => void };

/**
 * Basa proof: the page to read and the hold-to-talk button; scored without AI by matching the words heard. The page
 * and live transcript scroll above, and the button stays pinned at the bottom so it never moves while words come in.
 */
export function ReadAloudProof({ passage, onResult }: ReadAloudProofProps) {
  const t = useT();
  const [liveText, setLiveText] = useState('');
  const scroller = useRef<ScrollView>(null);
  return (
    <View className="flex-1 gap-3">
      <ScrollView ref={scroller} className="flex-1" contentContainerClassName="gap-4 pb-2" onContentSizeChange={() => liveText && scroller.current?.scrollToEnd({ animated: true })}>
        <Card title={passage.title}>
          <Text className="text-lg leading-8 text-ink-900">{passage.text}</Text>
        </Card>
        {liveText ? (
          <Text className="text-sm italic text-tara-700">
            {t('Heard', 'Narinig')}: {liveText}
          </Text>
        ) : null}
      </ScrollView>
      <HoldToTalk
        lang={passage.lang}
        label={t('Hold and read', 'Pindutin at basahin')}
        onLiveText={setLiveText}
        onDone={({ text, seconds }) => {
          const score = scoreReading(passage.text, text);
          const wpm = seconds > 0 ? Math.round((score.matched / seconds) * 60) : 0;
          const skipped = score.skipped.slice(0, 3).join(', ');
          const evidence = { read_seconds: Math.round(seconds), words_read: score.matched, words_total: score.total };
          const of = `${score.matched} / ${score.total}`;
          onResult(
            score.ratio >= 0.8
              ? {
                  verdict: 'patunay',
                  said: t(
                    `You read ${of} words at ${wpm} words a minute.${skipped ? ` Skipped: ${skipped}.` : ''} Your voice was not saved.`,
                    `Nabasa mo ang ${of} na salita, ${wpm} salita kada minuto.${skipped ? ` Nalaktawan: ${skipped}.` : ''} Hindi na-save ang boses mo.`,
                  ),
                  evidence,
                }
              : score.ratio >= 0.4
                ? { verdict: 'nakita', said: t(`I heard ${of} words. Read the whole page next time for 3x.`, `Narinig ko ang ${of} na salita. Basahin ang buong pahina sa susunod para 3x.`), evidence }
                : { verdict: 'not_confirmed', said: t(`I only caught ${of} words. Try again closer to the phone?`, `${of} na salita lang ang narinig ko. Subukan ulit nang mas malapit?`), evidence },
          );
        }}
      />
    </View>
  );
}
