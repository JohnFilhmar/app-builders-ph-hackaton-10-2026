import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { SourceCard } from '@/components/ai/SourceCard';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { cloudKey, useAiStore } from '@/lib/ai/aiSources';
import { useT } from '@/lib/i18n/translate';

/** AI settings: where Tara's text, photo and voice jobs run (phone, laptop on the Wi-Fi, or cloud) and the cloud key. */
export default function AiSettings() {
  const t = useT();
  const usesCloud = useAiStore((s) => Object.values(s.sources).some((src) => src.kind === 'cloud'));
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void cloudKey.get().then((k) => setHasKey(Boolean(k)));
  }, []);

  const saveKey = async () => {
    await cloudKey.set(key);
    setHasKey(Boolean(key.trim()));
    setKey('');
    setNote(key.trim() ? t('Key saved on this phone only.', 'Na-save ang key sa phone na ito lang.') : t('Key removed.', 'Tinanggal ang key.'));
  };

  return (
    <TaraScreen title={t('AI settings', 'AI settings')} subtitle={t('Choose where I think, see and listen.', 'Piliin kung saan ako mag-iisip, titingin at makikinig.')} canGoBack>
      <TaraBubble
        text={t(
          "My phone brain is small. For better checks, use a laptop on your Wi-Fi or a cloud model. If a laptop or the cloud can't be reached, I switch back to the phone.",
          'Maliit ang utak ko sa phone. Para mas tumpak, gumamit ng laptop sa Wi-Fi o cloud model. Kapag hindi maabot, babalik ako sa phone.',
        )}
      />
      <SourceCard capability="brain" title={t('Text: plans, quizzes, chat', 'Text: plano, quiz, chat')} needs="text" allowLan />
      <SourceCard capability="eyes" title={t('Photos: Before & After, notes', 'Litrato: Before & After, notes')} needs="image" allowLan />
      <SourceCard capability="ears" title={t('Voice: reading and counting', 'Boses: pagbasa at pagbilang')} needs="audio" allowLan={false} />
      <Card title={t('OpenRouter key', 'OpenRouter key')}>
        <Text className="text-sm text-tara-700">
          {hasKey ? t('A key is saved in secure storage.', 'May naka-save na key sa secure storage.') : t('No key yet. Get one at openrouter.ai/keys.', 'Wala pang key. Kumuha sa openrouter.ai/keys.')}
        </Text>
        <Field label={t('API key', 'API key')} value={key} onChangeText={setKey} placeholder="sk-or-..." autoCapitalize="none" secureTextEntry />
        <Button label={key.trim() ? t('Save key', 'I-save ang key') : t('Remove key', 'Tanggalin ang key')} variant="secondary" icon={null} disabled={!key.trim() && !hasKey} onPress={() => void saveKey()} />
        {note ? <Text className="text-sm text-tara-700">{note}</Text> : null}
        {usesCloud ? <Text className="text-sm font-bold text-tara-700">{t('Cloud is on: those jobs send data to OpenRouter.', 'Naka-on ang cloud: may data na ipapadala sa OpenRouter.')}</Text> : null}
      </Card>
    </TaraScreen>
  );
}
