import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Segmented } from '@/components/Segmented';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraThoughts } from '@/components/tara/TaraThoughts';
import { useT } from '@/lib/i18n/translate';
import { PASSAGES, type Passage } from '@/lib/quests/questTypes';
import { passageFromPhoto, writePassage } from '@/lib/quests/readingPassages';
import { errorMessage } from '@/utils/errorMessage';

type Source = 'photo' | 'tara' | 'surprise' | 'builtin';

type ReadingPickerProps = {
  /** the page chosen so far */
  passage: Passage;
  onChange: (passage: Passage) => void;
  /** opens the in-app camera; null when the user backs out */
  takePhoto: () => Promise<string | null>;
  /** a starting topic for "Tara writes", usually the quest title */
  suggestedTopic: string;
};

/**
 * Where the Basa page comes from: a photo of a real book, a page Tara writes on a topic, a surprise topic, or one of
 * the built-in pages. Whatever is picked shows below as the page to read, so the player sees it before starting.
 */
export function ReadingPicker({ passage, onChange, takePhoto, suggestedTopic }: ReadingPickerProps) {
  const t = useT();
  const [source, setSource] = useState<Source>('builtin');
  const [lang, setLang] = useState<Passage['lang']>('en');
  const [topic, setTopic] = useState(/read|basa/i.test(suggestedTopic) ? '' : suggestedTopic);
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const run = async (stage: string, make: () => Promise<Passage | null>) => {
    setBusy(stage);
    setProblem(null);
    try {
      const made = await make();
      if (made) onChange(made);
    } catch (err) {
      setProblem(errorMessage(err));
    }
    setBusy(null);
  };

  const fromPhoto = () =>
    run(t('Tara is reading your page...', 'Binabasa ni Tara ang pahina mo...'), async () => {
      const uri = await takePhoto();
      return uri ? passageFromPhoto(uri) : null;
    });

  return (
    <View className="gap-3">
      <Segmented
        options={[
          { value: 'photo', label: t('Book photo', 'Litrato'), icon: 'camera' },
          { value: 'tara', label: t('Tara writes', 'Si Tara'), icon: 'sparkle' },
          { value: 'surprise', label: t('Surprise', 'Sorpresa'), icon: 'star' },
          { value: 'builtin', label: t('Built-in', 'Nakahanda'), icon: 'book' },
        ]}
        value={source}
        onChange={(s) => {
          setSource(s);
          setProblem(null);
        }}
      />

      {source === 'photo' ? (
        <>
          <TaraBubble text={t('Take a clear photo of one page of a textbook or book. I will read it and you read it back to me.', 'Kunan nang malinaw ang isang pahina ng libro. Babasahin ko ito, tapos basahin mo pabalik sa akin.')} />
          <Button label={t('Photograph a page', 'Kunan ang pahina')} icon="camera" isBusy={busy !== null} onPress={() => void fromPhoto()} />
        </>
      ) : null}

      {source === 'tara' || source === 'surprise' ? (
        <>
          <Segmented
            options={[
              { value: 'en', label: 'English', icon: 'globe' },
              { value: 'tl', label: 'Tagalog', icon: 'globe' },
            ]}
            value={lang}
            onChange={setLang}
          />
          {source === 'tara' ? (
            <>
              <Field label={t('Topic', 'Paksa')} value={topic} onChangeText={setTopic} placeholder={t('Jose Rizal, the water cycle, my barangay', 'Jose Rizal, ang bagyo, ang barangay ko')} />
              <Button
                label={t('Write my page', 'Isulat ang pahina')}
                icon="sparkle"
                isBusy={busy !== null}
                disabled={!topic.trim()}
                onPress={() => void run(t('Tara is writing your page...', 'Isinusulat ni Tara ang pahina mo...'), () => writePassage(topic, lang))}
              />
            </>
          ) : (
            <Button label={t('Surprise me', 'Sorpresahin ako')} icon="star" isBusy={busy !== null} onPress={() => void run(t('Tara is picking a topic...', 'Pumipili si Tara ng paksa...'), () => writePassage(undefined, lang))} />
          )}
        </>
      ) : null}

      {source === 'builtin' ? <Segmented options={PASSAGES.map((p) => ({ value: p.id, label: `${p.title} (${p.lang.toUpperCase()})` }))} value={passage.id} onChange={(id) => onChange(PASSAGES.find((p) => p.id === id) ?? passage)} /> : null}

      {busy ? <TaraBubble text={busy} isThinking /> : null}
      {busy ? <TaraThoughts /> : null}
      {problem ? <TaraBubble text={t(`I couldn't make that page (${problem}). Try again, or pick a built-in page.`, `Hindi ko nagawa ang pahina (${problem}). Subukan ulit, o pumili ng nakahandang pahina.`)} /> : null}

      <Card title={`${t('Your page', 'Pahina mo')}: ${passage.title}`}>
        <Text className="text-base leading-7 text-ink-900">{passage.text}</Text>
      </Card>
    </View>
  );
}
