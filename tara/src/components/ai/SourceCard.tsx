import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Segmented } from '@/components/Segmented';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { normalizeServer, useAiStore, type AiSource, type RemoteSource } from '@/lib/ai/aiSources';
import { listModels, remoteChat } from '@/lib/ai/remoteChat';
import { useT } from '@/lib/i18n/translate';
import { PALETTE } from '@/lib/theme/palette';
import type { CapabilityId } from '@/types/catalog';
import { errorMessage } from '@/utils/errorMessage';

type SourceCardProps = {
  capability: CapabilityId;
  title: string;
  /** what input a model must accept for this job */
  needs: 'text' | 'image' | 'audio';
  /** Ollama has no speech-to-text, so the voice job hides the laptop option */
  allowLan: boolean;
};

function ModelChip({ name, isPicked, onPress }: { name: string; isPicked: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: isPicked }} onPress={onPress}>
      <PolyFrame cut={6} fill={isPicked ? PALETTE.sipag400 : PALETTE.white} stroke={isPicked ? PALETTE.sipag600 : PALETTE.banig300}>
        <Text className="px-2.5 py-2 text-sm text-ink-900">{name}</Text>
      </PolyFrame>
    </Pressable>
  );
}

/**
 * Picks where one AI job runs: the phone, an Ollama laptop on the Wi-Fi, or an OpenRouter cloud model. Models are
 * listed live from the chosen server, and "Test" sends one tiny request so a bad address shows up here, not mid-quest.
 */
export function SourceCard({ capability, title, needs, allowLan }: SourceCardProps) {
  const t = useT();
  const source = useAiStore((s) => s.sources[capability]);
  const servers = useAiStore((s) => s.lan_servers);
  const setSource = useAiStore((s) => s.setSource);
  const rememberServer = useAiStore((s) => s.rememberServer);
  const [server, setServer] = useState(source.kind === 'lan' ? source.base_url : (servers[0] ?? ''));
  const [models, setModels] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const model = source.kind === 'device' ? '' : source.model;
  const remote = (m: string): RemoteSource => (source.kind === 'cloud' ? { kind: 'cloud', model: m } : { kind: 'lan', base_url: normalizeServer(server), model: m });

  const pickKind = (kind: AiSource['kind']) => {
    setModels([]);
    setStatus(null);
    if (kind === 'device') setSource(capability, { kind: 'device' });
    else if (kind === 'cloud') setSource(capability, { kind: 'cloud', model: '' });
    else setSource(capability, { kind: 'lan', base_url: normalizeServer(server || '192.168.1.2'), model: '' });
  };

  const run = async (job: () => Promise<string>) => {
    setIsBusy(true);
    setStatus(null);
    try {
      setStatus(await job());
    } catch (err) {
      setStatus(t(`Problem: ${errorMessage(err)}`, `Problema: ${errorMessage(err)}`));
    }
    setIsBusy(false);
  };

  const findModels = () =>
    run(async () => {
      if (source.kind === 'lan') rememberServer(normalizeServer(server));
      const found = await listModels(remote(model), needs);
      setModels(found);
      return found.length ? t(`${found.length} models found`, `${found.length} na model ang nakita`) : t('No models found', 'Walang nakitang model');
    });

  const test = () =>
    run(async () => {
      const started = Date.now();
      const reply = await remoteChat(remote(model), [{ role: 'user', content: 'Reply with only the word OK.' }], { maxTokens: 5, temperature: 0 });
      return t(`Works: "${reply.trim().slice(0, 20)}" in ${Date.now() - started} ms`, `Gumagana: "${reply.trim().slice(0, 20)}" sa ${Date.now() - started} ms`);
    });

  const shown = models.filter((m) => m.toLowerCase().includes(search.toLowerCase())).slice(0, 12);
  const kinds: { value: AiSource['kind']; label: string }[] = [
    { value: 'device', label: t('This phone', 'Itong phone') },
    ...(allowLan ? [{ value: 'lan' as const, label: t('Laptop (Wi-Fi)', 'Laptop (Wi-Fi)') }] : []),
    { value: 'cloud', label: 'Cloud' },
  ];

  return (
    <Card title={title}>
      <Segmented options={kinds} value={source.kind} onChange={pickKind} />
      {source.kind === 'device' ? (
        <Text className="text-sm text-tara-700">{t('Private and offline. Smallest model, least accurate.', 'Pribado at offline. Pinakamaliit na model, hindi gaanong tumpak.')}</Text>
      ) : null}
      {source.kind === 'lan' ? (
        <>
          <Text className="text-sm text-tara-700">
            {t('A laptop on the same Wi-Fi running Ollama. Start it with OLLAMA_HOST=0.0.0.0 so the phone can reach it.', 'Laptop sa parehong Wi-Fi na may Ollama. Patakbuhin gamit ang OLLAMA_HOST=0.0.0.0 para maabot ng phone.')}
          </Text>
          <Field label={t('Laptop address', 'Address ng laptop')} value={server} onChangeText={setServer} placeholder="192.168.1.5:11434" autoCapitalize="none" keyboardType="url" />
          {servers.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {servers.map((s) => (
                <ModelChip key={s} name={s.replace(/^https?:\/\//, '')} isPicked={normalizeServer(server) === s} onPress={() => setServer(s)} />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
      {source.kind === 'cloud' ? (
        <Text className="text-sm text-tara-700">
          {t('OpenRouter. Strongest models, but photos and voice for this job leave the phone. Needs internet and a key.', 'OpenRouter. Pinakamalakas na model, pero lalabas ng phone ang litrato at boses. Kailangan ng internet at key.')}
        </Text>
      ) : null}
      {source.kind !== 'device' ? (
        <>
          <Button label={t('Find models', 'Hanapin ang mga model')} variant="secondary" icon={null} isBusy={isBusy} onPress={() => void findModels()} />
          {models.length > 8 ? <Field label={t('Search models', 'Hanapin')} value={search} onChangeText={setSearch} placeholder="gemini, qwen, llama" autoCapitalize="none" /> : null}
          {shown.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {shown.map((m) => (
                <ModelChip key={m} name={m} isPicked={m === model} onPress={() => setSource(capability, remote(m))} />
              ))}
            </View>
          ) : null}
          <Field label={t('Model', 'Model')} value={model} onChangeText={(m) => setSource(capability, remote(m.trim()))} placeholder={source.kind === 'lan' ? 'gemma3:4b' : 'google/gemini-2.5-flash'} autoCapitalize="none" />
          <Button label={t('Test', 'Subukan')} variant="secondary" icon={null} isBusy={isBusy} disabled={!model} onPress={() => void test()} />
        </>
      ) : null}
      {status ? <Text className="text-sm text-tara-700">{status}</Text> : null}
    </Card>
  );
}
