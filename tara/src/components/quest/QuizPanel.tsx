import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { BlockBar } from '@/components/tara/LevelBar';
import { useT } from '@/lib/i18n/translate';
import { PALETTE } from '@/lib/theme/palette';
import type { QuizQuestion } from '@/types/quest';

type QuizPanelProps = { quiz: QuizQuestion[]; onFinish: (correct: number) => void };

/** The Aral quiz, one question at a time, answered by tapping. The quiz was prepared before the timer started. */
export function QuizPanel({ quiz, onFinish }: QuizPanelProps) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = quiz[index];
  if (!q) return null;

  const pick = (choice: number) => {
    if (picked !== null) return;
    setPicked(choice);
    const total = correct + (choice === q.answer ? 1 : 0);
    setTimeout(() => {
      setPicked(null);
      if (index + 1 >= quiz.length) onFinish(total);
      else {
        setCorrect(total);
        setIndex(index + 1);
      }
    }, 800);
  };

  return (
    <View className="gap-3">
      <View className="gap-2">
        <Text className="font-pixel text-sm text-tara-700">{t(`Question ${index + 1} of ${quiz.length}`, `Tanong ${index + 1} sa ${quiz.length}`)}</Text>
        <BlockBar progress={(index + 1) / quiz.length} blocks={quiz.length} />
      </View>
      <Text className="text-xl font-bold leading-7 text-ink-900">{q.question}</Text>
      {q.choices.map((choice, i) => {
        const isShown = picked !== null;
        const isRight = isShown && i === q.answer;
        const isWrongPick = isShown && i === picked && i !== q.answer;
        return (
          <Pressable key={`${index}-${i}`} accessibilityRole="button" onPress={() => pick(i)}>
            <PolyFrame cut={10} fill={isRight ? PALETTE.leaf100 : isWrongPick ? PALETTE.banig200 : PALETTE.white} stroke={isRight ? PALETTE.leaf500 : PALETTE.banig300} strokeWidth={isRight ? 2.5 : 1.5}>
              <View className="min-h-14 flex-row items-center gap-3 px-4 py-3">
                <Text className="font-pixel-bold text-base text-tara-500">{'ABC'[i]}</Text>
                <Text className="flex-1 text-base text-ink-900">{choice}</Text>
                {isRight ? <PixelIcon name="check" size={18} color={PALETTE.leaf700} /> : null}
              </View>
            </PolyFrame>
          </Pressable>
        );
      })}
    </View>
  );
}
