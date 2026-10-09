import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Segmented } from '@/components/Segmented';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { normalizeServer, useAiStore, voiceServerKey, type AiSource, type RemoteSource } from '@/lib/ai/aiSources';
import { isThinkingModel, listModels, remoteChat, voiceServerHeaders } from '@/lib/ai/remoteChat';
import { heroArtFor } from '@/lib/hero/heroArt';
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
  const [voiceKey, setVoiceKey] = useState('');
  const [hasVoiceKey, setHasVoiceKey] = useState(false);
  const isVoiceLan = needs === 'audio' && source.kind === 'lan';
  useEffect(() => {
    if (isVoiceLan) void voiceServerKey.get().then((k) => setHasVoiceKey(Boolean(k)));
  }, [isVoiceLan]);
  const saveVoiceKey = async () => {
    await voiceServerKey.set(voiceKey);
    setHasVoiceKey(Boolean(voiceKey.trim()));
    setVoiceKey('');
    setStatus(voiceKey.trim() ? t('Key saved', 'Na-save ang key') : t('Key removed', 'Tinanggal ang key'));
  };

  const model = source.kind === 'device' ? '' : source.model;
  // a Whisper server usually listens on 8080; Ollama on 11434
  const port = needs === 'audio' ? 8080 : 11434;
  const think = source.kind === 'lan' ? source.think : undefined;
  const remote = (m: string): RemoteSource => (source.kind === 'cloud' ? { kind: 'cloud', model: m } : { kind: 'lan', base_url: normalizeServer(server, port), model: m, think });
  const [canThink, setCanThink] = useState(false);
  const lanModelKey = source.kind === 'lan' && needs !== 'audio' && source.model ? `${source.base_url}|${source.model}` : '';
  useEffect(() => {
    setCanThink(false);
    if (!lanModelKey || source.kind !== 'lan') return;
    let isCurrent = true;
    void isThinkingModel(source).then((yes) => isCurrent && setCanThink(yes));
    return () => {
      isCurrent = false;
    };
  }, [lanModelKey]);

  const pickKind = (kind: AiSource['kind']) => {
    setModels([]);
    setStatus(null);
    if (kind === 'device') setSource(capability, { kind: 'device' });
    else if (kind === 'cloud') setSource(capability, { kind: 'cloud', model: '' });
    else setSource(capability, { kind: 'lan', base_url: normalizeServer(server || '192.168.1.2', port), model: needs === 'audio' ? 'whisper-1' : '' });
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
      if (source.kind === 'lan') rememberServer(normalizeServer(server, port));
      const found = await listModels(remote(model), needs);
      setModels(found);
      return found.length ? t(`${found.length} models found`, `${found.length} na model ang nakita`) : t('No models found', 'Walang nakitang model');
    });

  const test = () =>
    run(async () => {
      if (needs === 'audio' && source.kind === 'lan') {
        // a voice server cannot answer a chat prompt; reaching it is the test
        const res = await fetch(`${normalizeServer(server, port)}/v1/models`, { headers: await voiceServerHeaders(), signal: AbortSignal.timeout(6000) }).catch(() => null);
        if (!res) throw new Error(t('Cannot reach the voice server', 'Hindi maabot ang voice server'));
        if (res.status === 401 || res.status === 403) throw new Error(t('The voice server refused the key', 'Tinanggihan ng voice server ang key'));
        return t('Voice server reachable', 'Naaabot ang voice server');
      }
      const started = Date.now();
      let thoughtChars = 0;
      // a photo model gets a real picture: vision-only models (moondream) answer nothing to a text-only prompt
      const imagePath = needs === 'image' ? ((await Asset.fromModule(heroArtFor(1)).downloadAsync()).localUri ?? undefined) : undefined;
      const prompt = needs === 'image' ? 'What is in this picture? Answer in one short sentence.' : 'Reply with only the word OK.';
      const reply = await remoteChat(remote(model), [{ role: 'user', content: prompt }], { maxTokens: needs === 'image' ? 60 : 20, temperature: 0, imagePath, onThinking: (r) => (thoughtChars = r.length) });
      const thought = thoughtChars ? t(`, after ${thoughtChars} characters of thinking`, `, pagkatapos mag-isip ng ${thoughtChars} na titik`) : '';
      return t(`Works: "${reply.trim().slice(0, 60)}" in ${Date.now() - started} ms${thought}`, `Gumagana: "${reply.trim().slice(0, 60)}" sa ${Date.now() - started} ms${thought}`);
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
            {needs === 'audio'
              ? t(
                  'A laptop on the same Wi-Fi running a Whisper server with /v1/audio/transcriptions, e.g. whisper.cpp server on port 8080 started with --host 0.0.0.0 --inference-path /v1/audio/transcriptions.',
                  'Laptop sa parehong Wi-Fi na may Whisper server (/v1/audio/transcriptions), hal. whisper.cpp server sa port 8080 na may --host 0.0.0.0 --inference-path /v1/audio/transcriptions.',
                )
              : t(
                  'A laptop on the same Wi-Fi running Ollama. Start it with OLLAMA_HOST=0.0.0.0 so the phone can reach it.',
                  'Laptop sa parehong Wi-Fi na may Ollama. Patakbuhin gamit ang OLLAMA_HOST=0.0.0.0 para maabot ng phone.',
                )}
          </Text>
          <Field
            label={t('Laptop address', 'Address ng laptop')}
            value={server}
            onChangeText={setServer}
            placeholder={needs === 'audio' ? '192.168.1.5:8080' : '192.168.1.5:11434'}
            autoCapitalize="none"
            keyboardType="url"
          />
          {servers.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {servers.map((s) => (
                <ModelChip key={s} name={s.replace(/^https?:\/\//, '')} isPicked={normalizeServer(server, port) === s} onPress={() => setServer(s)} />
              ))}
            </View>
          ) : null}
          {isVoiceLan ? (
            <>
              <Field
                label={t('Authorization key (optional)', 'Authorization key (opsyonal)')}
                value={voiceKey}
                onChangeText={setVoiceKey}
                placeholder={hasVoiceKey ? t('Saved. Type to replace, or save empty to remove', 'Naka-save. I-type para palitan, o i-save nang blangko para tanggalin') : 'sk-... or Basic ...'}
                autoCapitalize="none"
                secureTextEntry
              />
              <Button label={t('Save key', 'I-save ang key')} variant="secondary" icon={null} onPress={() => void saveVoiceKey()} />
            </>
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
          <Field label={t('Model', 'Model')} value={model} onChangeText={(m) => setSource(capability, remote(m.trim()))} placeholder={source.kind === 'lan' ? (needs === 'audio' ? 'whisper-1' : 'gemma3:4b') : 'google/gemini-2.5-flash'} autoCapitalize="none" />
          {canThink && source.kind === 'lan' ? (
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-base font-bold text-ink-900">{t('Let it think', 'Hayaang mag-isip')}</Text>
                <Text className="text-sm text-tara-700">
                  {t(
                    "This model can reason before it answers. On: smarter but slower, and you see Tara's thoughts. Off: answers right away. Quick yes/no checks never think.",
                    'Kaya ng model na ito na mag-isip bago sumagot. On: mas matalino pero mas mabagal, at makikita mo ang iniisip ni Tara. Off: sasagot agad. Hindi nag-iisip ang mabilisang oo/hindi.',
                  )}
                </Text>
              </View>
              <Switch
                value={source.think === true}
                trackColor={{ true: PALETTE.sipag500, false: PALETTE.banig300 }}
                thumbColor={PALETTE.white}
                onValueChange={(on) => setSource(capability, { ...source, think: on })}
              />
            </View>
          ) : null}
          <Button label={t('Test', 'Subukan')} variant="secondary" icon={null} isBusy={isBusy} disabled={!model} onPress={() => void test()} />
        </>
      ) : null}
      {status ? <Text className="text-sm text-tara-700">{status}</Text> : null}
    </Card>
  );
}
