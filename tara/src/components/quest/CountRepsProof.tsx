import { useState } from 'react';
import { Text, View } from 'react-native';

import { HoldToTalk } from '@/components/quest/HoldToTalk';
import { countingRuns, numberSequence } from '@/lib/checks/scoring';
import { useT } from '@/lib/i18n/translate';
import { COUNTING_PROMPT } from '@/lib/quests/questTypes';

type CountRepsProofProps = { target: number; onCounted: (transcript: string) => void };

/** Ehersisyo proof: count aloud while holding; the live line shows the runs heard so far, never a premature total. */
export function CountRepsProof({ target, onCounted }: CountRepsProofProps) {
  const t = useT();
  const [liveText, setLiveText] = useState('');
  const runs = countingRuns(numberSequence(liveText))
    .filter((r) => r.length >= 2)
    .map((r) => `${r.from}-${r.to}`)
    .join(', ');
  return (
    <View className="gap-4">
      <View className="items-center gap-1">
        <Text className="font-pixel-bold text-5xl text-ink-900">{target}</Text>
        <Text className="font-pixel text-base text-tara-700">{t('reps to go', 'reps ang target')}</Text>
      </View>
      <Text className="text-center text-base text-tara-700">
        {runs ? `${t('Heard', 'Narinig')}: ${runs}` : t('Start counting when you start moving.', 'Magbilang habang gumagalaw.')}
      </Text>
      <HoldToTalk lang="auto" prompt={COUNTING_PROMPT} label={t('Hold and count', 'Pindutin at bilangin')} onLiveText={setLiveText} onDone={({ text }) => onCounted(text)} />
    </View>
  );
}
