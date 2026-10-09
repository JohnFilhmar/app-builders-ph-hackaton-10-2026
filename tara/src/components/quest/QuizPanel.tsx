import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { QuizQuestion } from '@/types/quest';

type QuizPanelProps = { quiz: QuizQuestion[]; onFinish: (correct: number) => void };

/** The Aral quiz, one question at a time, answered by tapping. The quiz was prepared before the timer ended. */
export function QuizPanel({ quiz, onFinish }: QuizPanelProps) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = quiz[index];
  if (!q) return null;

  const pick = (choice: number) => {
    if (picked !== null) return;
    setPicked(choice);
    const right = choice === q.answer;
    const total = correct + (right ? 1 : 0);
    setTimeout(() => {
      setPicked(null);
      if (index + 1 >= quiz.length) onFinish(total);
      else {
        setCorrect(total);
        setIndex(index + 1);
      }
    }, 700);
  };

  return (
    <View className="gap-3">
      <Text className="text-sm font-bold text-tara-500">
        Tanong {index + 1} of {quiz.length}
      </Text>
      <Text className="text-xl font-bold text-tara-900">{q.question}</Text>
      {q.choices.map((choice, i) => {
        const shown = picked !== null;
        const style = !shown ? 'bg-white' : i === q.answer ? 'bg-leaf-100 border-leaf-500' : i === picked ? 'bg-banig-200' : 'bg-white';
        return (
          <Pressable key={choice} accessibilityRole="button" onPress={() => pick(i)} className={`rounded-2xl border-2 border-banig-200 p-4 ${style}`}>
            <Text className="text-base text-tara-900">{choice}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
