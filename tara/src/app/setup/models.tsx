import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { newEventId } from '@/lib/game/completeQuest';
import { downloadModel } from '@/lib/models/modelDownload';
import { isModelOnDisk } from '@/lib/models/modelPaths';
import { useGameStore } from '@/lib/stores/gameStore';
import { useSetupStore } from '@/lib/stores/setupStore';
import { taraCatalogSchema, type Tier } from '@/types/catalog';
import { errorMessage } from '@/utils/errorMessage';

const ramGb = Device.totalMemory ? Device.totalMemory / 1024 ** 3 : 0;
const sizeMb = (tier: Tier) => Math.round(tier.files.reduce((n, f) => n + f.size_bytes, 0) / 1e6);
const fits = (tier: Tier) => ramGb === 0 || ramGb + 0.5 >= tier.min_ram_gb;

function TierRow({ tier, isChosen, onChoose }: { tier: Tier; isChosen: boolean; onChoose: () => void }) {
  const isLocked = !fits(tier);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isChosen, disabled: isLocked }}
      disabled={isLocked}
      onPress={onChoose}
      className={`gap-1 rounded-2xl border-2 p-3 ${isChosen ? 'border-sipag-500 bg-sipag-300/40' : 'border-banig-200 bg-white'}`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-tara-900">
          {isChosen ? '● ' : '○ '}
          {tier.label}
          {tier.recommended ? '  (recommended)' : ''}
        </Text>
        <Text className="text-xs text-tara-500">{sizeMb(tier)} MB</Text>
      </View>
      <Text className="text-sm text-tara-700">{tier.summary}</Text>
      {tier.pros.map((p) => (
        <Text key={p} className="text-sm text-leaf-700">
          + {p}
        </Text>
      ))}
      {tier.cons.map((c) => (
        <Text key={c} className="text-sm text-tara-500">
          − {c}
        </Text>
      ))}
      {isLocked ? (
        <View className="absolute inset-0 items-center justify-center rounded-2xl bg-white/85 p-3">
          <Text className="text-center text-sm font-bold text-tara-700">
            Hindi kaya ng phone na ito. Needs {tier.min_ram_gb} GB RAM; this phone has {ramGb.toFixed(1)} GB.
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** First launch, step 2: choose a tier per capability (only tiers this phone can run), then download them once. */
export default function SetupModels() {
  const { backendUrl, catalog, chosenTiers, baseAvatar, setBackendUrl, setCatalog, chooseTier, finishSetup } = useSetupStore();
  const append = useGameStore((s) => s.append);
  const [serverInput, setServerInput] = useState(backendUrl);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchCatalog = useCallback(async (url: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${url}/tara/catalog`, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = taraCatalogSchema.safeParse(await res.json());
      if (!parsed.success) throw new Error('The server sent a catalog this app cannot read');
      setCatalog(parsed.data);
    } catch (err) {
      setLoadError(errorMessage(err));
    }
    setIsLoading(false);
  }, [setCatalog]);

  useEffect(() => {
    void fetchCatalog(backendUrl);
  }, [backendUrl, fetchCatalog]);

  // a recommended tier this phone cannot run falls back to the best one it can
  useEffect(() => {
    for (const cap of catalog?.capabilities ?? []) {
      const chosen = cap.tiers.find((t) => t.id === chosenTiers[cap.id]);
      if (chosen && fits(chosen)) continue;
      const fallback = cap.tiers.find((t) => t.recommended && fits(t)) ?? cap.tiers.find(fits);
      if (fallback && fallback.id !== chosen?.id) chooseTier(cap.id, fallback.id);
    }
  }, [catalog, chosenTiers, chooseTier]);

  const chosen = (catalog?.capabilities ?? []).flatMap((cap) => cap.tiers.filter((t) => t.id === chosenTiers[cap.id] && fits(t)));
  const canStart = catalog !== null && chosen.length === catalog.capabilities.length;

  const downloadAll = async () => {
    setIsDownloading(true);
    try {
      for (const [i, tier] of chosen.entries()) {
        if (await isModelOnDisk(tier)) continue;
        await downloadModel(tier, {
          onProgress: (f) => setProgress(`Downloading ${i + 1} of ${chosen.length}: ${Math.round(f * 100)}%`),
          onVerifying: () => setProgress(`Checking ${i + 1} of ${chosen.length}...`),
        });
      }
      append({ id: newEventId('evt'), type: 'profile_created', at: Date.now(), payload: { base_avatar: baseAvatar } });
      finishSetup();
      router.replace('/bahay');
    } catch (err) {
      setProgress(`Download stopped: ${errorMessage(err)}. Tap again to resume.`);
    }
    setIsDownloading(false);
  };

  return (
    <TaraScreen title="Ihanda si Tara" subtitle="Set up Tara's brain, eyes and ears, once.">
      <TaraBubble
        text={isDownloading ? (progress ?? 'Getting ready...') : 'Pick how I think, see and hear. These download once, then I work with no signal at all.'}
        isThinking={isDownloading || isLoading}
      />
      {catalog?.capabilities.map((cap) => (
        <Card key={cap.id} title={cap.label}>
          <Text className="text-sm text-tara-500">{cap.purpose}</Text>
          {cap.tiers.map((tier) => (
            <TierRow key={tier.id} tier={tier} isChosen={chosenTiers[cap.id] === tier.id} onChoose={() => chooseTier(cap.id, tier.id)} />
          ))}
        </Card>
      ))}
      {loadError ? (
        <Card title="Can't reach the Tara server">
          <Text className="text-sm text-tara-700">{loadError}</Text>
          <Field label="Server address" value={serverInput} onChangeText={setServerInput} autoCapitalize="none" keyboardType="url" />
          <Button label="Try again" variant="secondary" onPress={() => setBackendUrl(serverInput)} />
        </Card>
      ) : null}
      {progress && !isDownloading ? <Text className="text-sm text-tara-700">{progress}</Text> : null}
      <Button label={`Download (${chosen.reduce((n, t) => n + sizeMb(t), 0)} MB) & start`} onPress={() => void downloadAll()} disabled={!canStart} isBusy={isDownloading} />
    </TaraScreen>
  );
}
