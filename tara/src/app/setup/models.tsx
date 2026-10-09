import * as Device from 'expo-device';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { PixelIcon } from '@/components/poly/PixelIcon';
import { PolyFrame } from '@/components/poly/PolyFrame';
import { TaraBubble } from '@/components/tara/TaraBubble';
import { TaraScreen } from '@/components/tara/TaraScreen';
import { newEventId } from '@/lib/game/completeQuest';
import { useT } from '@/lib/i18n/translate';
import { downloadModel } from '@/lib/models/modelDownload';
import { isModelOnDisk } from '@/lib/models/modelPaths';
import { useGameStore } from '@/lib/stores/gameStore';
import { useSetupStore } from '@/lib/stores/setupStore';
import { PALETTE } from '@/lib/theme/palette';
import { taraCatalogSchema, type Tier } from '@/types/catalog';
import { errorMessage } from '@/utils/errorMessage';

const KEEP_AWAKE_TAG = 'model-download';
const ramGb = Device.totalMemory ? Device.totalMemory / 1024 ** 3 : 0;
const sizeMb = (tier: Tier) => Math.round(tier.files.reduce((n, f) => n + f.size_bytes, 0) / 1e6);
const fits = (tier: Tier) => ramGb === 0 || ramGb + 0.5 >= tier.min_ram_gb;

function TierRow({ tier, isChosen, onChoose }: { tier: Tier; isChosen: boolean; onChoose: () => void }) {
  const t = useT();
  const isLocked = !fits(tier);
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: isChosen, disabled: isLocked }} disabled={isLocked} onPress={onChoose}>
      <PolyFrame cut={10} fill={isChosen ? '#FFF4D1' : PALETTE.white} stroke={isChosen ? PALETTE.sipag500 : PALETTE.banig300} strokeWidth={isChosen ? 3.5 : 2.5}>
        <View className="gap-1 p-3.5">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1 flex-row items-center gap-2">
              {isChosen ? <PixelIcon name="check" size={16} color={PALETTE.sipag600} /> : null}
              <Text className="font-pixel-bold text-base text-ink-900">{tier.label}</Text>
              {tier.recommended ? <Text className="font-pixel text-xs text-sipag-600">{t('BEST PICK', 'MUNGKAHI')}</Text> : null}
            </View>
            <Text className="font-pixel text-xs text-tara-700">{sizeMb(tier)} MB</Text>
          </View>
          <Text className="text-sm text-tara-700">{tier.summary}</Text>
          {tier.pros.map((p) => (
            <Text key={p} className="text-sm text-leaf-700">
              + {p}
            </Text>
          ))}
          {tier.cons.map((c) => (
            <Text key={c} className="text-sm text-tara-700">
              - {c}
            </Text>
          ))}
        </View>
        {isLocked ? (
          <View className="absolute inset-0 flex-row items-center justify-center gap-2 bg-banig-50/90 p-3">
            <PixelIcon name="lock" size={18} color={PALETTE.tara700} />
            <Text className="flex-1 text-center text-sm font-bold text-tara-700">
              {t(`This phone can't run it. Needs ${tier.min_ram_gb} GB RAM; this phone has ${ramGb.toFixed(1)} GB.`, `Hindi kaya ng phone na ito. Kailangan ng ${tier.min_ram_gb} GB RAM; ${ramGb.toFixed(1)} GB lang ito.`)}
            </Text>
          </View>
        ) : null}
      </PolyFrame>
    </Pressable>
  );
}

/** First launch, step 2: choose a tier per capability (only tiers this phone can run), then download them once. */
export default function SetupModels() {
  const { backendUrl, catalog, chosenTiers, baseAvatar, setBackendUrl, setCatalog, chooseTier, finishSetup } = useSetupStore();
  const t = useT();
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
    // the phone sleeping mid-download killed the transfer and restarted it, so the screen stays on until it finishes
    await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    try {
      for (const [i, tier] of chosen.entries()) {
        if (await isModelOnDisk(tier)) continue;
        await downloadModel(tier, {
          onProgress: (f) => setProgress(t(`Downloading ${i + 1} of ${chosen.length}: ${Math.round(f * 100)}%`, `Dina-download ${i + 1} sa ${chosen.length}: ${Math.round(f * 100)}%`)),
          onVerifying: () => setProgress(t(`Checking ${i + 1} of ${chosen.length}...`, `Sinusuri ${i + 1} sa ${chosen.length}...`)),
        });
      }
      append({ id: newEventId('evt'), type: 'profile_created', at: Date.now(), payload: { base_avatar: baseAvatar } });
      finishSetup();
      router.replace('/bahay');
    } catch (err) {
      setProgress(t(`Download stopped: ${errorMessage(err)}. Tap again to resume.`, `Huminto ang download: ${errorMessage(err)}. I-tap ulit para ituloy.`));
    }
    deactivateKeepAwake(KEEP_AWAKE_TAG);
    setIsDownloading(false);
  };

  return (
    <TaraScreen title={t('Get Tara ready', 'Ihanda si Tara')} subtitle={t("Set up Tara's brain, eyes and ears, once.", 'Ihanda ang utak, mata at tainga ni Tara, isang beses lang.')} canGoBack>
      <TaraBubble
        text={isDownloading ? (progress ?? t('Getting ready...', 'Naghahanda...')) : t('Pick how I think, see and hear. These download once, then I work with no signal at all.', 'Piliin kung paano ako mag-isip, tumingin at makinig. Isang beses lang i-download, tapos gagana ako kahit walang signal.')}
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
        <Card title={t("Can't reach the Tara server", 'Hindi maabot ang Tara server')}>
          <Text className="text-sm text-tara-700">{loadError}</Text>
          <Field label={t('Server address', 'Address ng server')} value={serverInput} onChangeText={setServerInput} autoCapitalize="none" keyboardType="url" />
          <Button label={t('Try again', 'Subukan ulit')} variant="secondary" onPress={() => setBackendUrl(serverInput)} />
        </Card>
      ) : null}
      {progress && !isDownloading ? <Text className="text-sm text-tara-700">{progress}</Text> : null}
      <Button label={t(`Download ${chosen.reduce((n, tier) => n + sizeMb(tier), 0)} MB and start`, `I-download ${chosen.reduce((n, tier) => n + sizeMb(tier), 0)} MB at simulan`)} onPress={() => void downloadAll()} disabled={!canStart} isBusy={isDownloading} />
    </TaraScreen>
  );
}
