import { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { MIN_NOTE_WORDS, quizFromNotes, readNotes } from '@/lib/checks/notesQuiz';
import { useT } from '@/lib/i18n/translate';
import type { QuizQuestion } from '@/types/quest';
import { errorMessage } from '@/utils/errorMessage';

type QuizPrepProps = {
  notesUri: string;
  onReady: (quiz: QuizQuestion[]) => void;
  /** no quiz this time: the quest can still land at Nakita */
  onSkip: () => void;
};

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * Builds the Aral quiz right after the notes photo, before the study timer starts. Tara reads the page; when the
 * page comes back too short to quiz on, the user sees what Tara read and can fix it or type their key points.
 */
export function QuizPrep({ notesUri, onReady, onSkip }: QuizPrepProps) {
  const t = useT();
  const [stage, setStage] = useState(t('Tara is reading your notes...', 'Binabasa ni Tara ang notes mo...'));
  const [isBusy, setIsBusy] = useState(true);
  const [notes, setNotes] = useState('');
  const [needsHelp, setNeedsHelp] = useState(false);
  const didStart = useRef(false);

  const makeQuiz = async (text: string) => {
    setIsBusy(true);
    setNeedsHelp(false);
    setStage(t('Making your quiz...', 'Ginagawa ang quiz mo...'));
    try {
      const quiz = await quizFromNotes(text, (n) => setStage(t(`Writing question ${Math.min(5, n + 1)} of 5...`, `Isinusulat ang tanong ${Math.min(5, n + 1)} sa 5...`)));
      if (quiz) return onReady(quiz);
      setStage(t("I couldn't turn that into a quiz. Add a bit more detail and try again?", 'Hindi ko ito magawang quiz. Dagdagan ng detalye at subukan ulit?'));
    } catch (err) {
      setStage(t(`Something went wrong making the quiz (${errorMessage(err)}).`, `Nagkaproblema sa paggawa ng quiz (${errorMessage(err)}).`));
    }
    setNeedsHelp(true);
    setIsBusy(false);
  };

  useEffect(() => {
    if (didStart.current) return;
    didStart.current = true;
    void (async () => {
      try {
        const read = await readNotes(notesUri);
        setNotes(read);
        if (wordCount(read) >= MIN_NOTE_WORDS) return makeQuiz(read);
        setStage(t('I could only read a little of that page. Fix what I read, or type 2 or 3 key points from your notes.', 'Kaunti lang ang nabasa ko. Ayusin ang nabasa ko, o i-type ang 2 o 3 mahalagang punto.'));
      } catch (err) {
        setStage(t(`I had trouble reading the photo (${errorMessage(err)}). Type 2 or 3 key points from your notes instead.`, `Nahirapan akong basahin ang litrato (${errorMessage(err)}). I-type na lang ang 2 o 3 mahalagang punto.`));
      }
      setNeedsHelp(true);
      setIsBusy(false);
    })();
    // runs once per notes photo; the ref also stops a dev double-mount from reading twice
  }, []);

  return (
    <View className="gap-4">
      <Image source={{ uri: notesUri }} className="h-40 w-full" />
      <TaraBubble text={stage} isThinking={isBusy} />
      {needsHelp ? (
        <>
          <Field label={t('Your notes (Tara uses only these)', 'Notes mo (ito lang ang gagamitin ni Tara)')} value={notes} onChangeText={setNotes} multiline placeholder="Photosynthesis happens in the leaves..." />
          <Button label={t('Make the quiz', 'Gawin ang quiz')} onPress={() => void makeQuiz(notes)} disabled={wordCount(notes) < MIN_NOTE_WORDS} />
          <Button label={t('Skip the quiz (counts as Seen)', 'Laktawan (Nakita)')} variant="secondary" icon={null} onPress={onSkip} />
        </>
      ) : null}
    </View>
  );
}
