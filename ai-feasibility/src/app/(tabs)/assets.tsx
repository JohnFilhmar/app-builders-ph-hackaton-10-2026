import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { AxisControls } from '@/components/viewer3d/AxisControls';
import { ModelViewer } from '@/components/viewer3d/ModelViewer';
import { loadGlb, type LoadedModel } from '@/lib/viewer3d/loadGlb';
import { IDENTITY_TRANSFORM, type ModelTransform } from '@/types/viewer';
import { errorMessage } from '@/utils/errorMessage';

export default function AssetsScreen() {
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [transform, setTransform] = useState<ModelTransform>(IDENTITY_TRANSFORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    if (!asset.name.toLowerCase().endsWith('.glb')) {
      setError(`${asset.name} is not a .glb file`);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setModel(await loadGlb(asset.uri, asset.name));
      setTransform(IDENTITY_TRANSFORM);
    } catch (err) {
      setError(errorMessage(err));
    }
    setIsLoading(false);
  };

  const stats = model?.stats;
  return (
    <SafeAreaView edges={['top']} className="flex-1 gap-3 bg-neutral-50 p-4 dark:bg-neutral-950">
      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Assets</Text>
      <Button label={model ? 'Open another .glb' : 'Open .glb file'} onPress={() => void pick()} isBusy={isLoading} />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
      {stats ? (
        <Text className="text-xs text-neutral-500">
          {stats.fileName} · {(stats.sizeBytes / 1e6).toFixed(1)} MB · {stats.meshes} meshes · {stats.triangles.toLocaleString()} tris · loaded in{' '}
          {stats.loadMs} ms{stats.ignoredAnimations > 0 ? ` · ${stats.ignoredAnimations} animations ignored` : ''}
        </Text>
      ) : null}
      {model ? (
        <>
          <ModelViewer scene={model.scene} transform={transform} onTransformChange={setTransform} />
          <Text className="text-center text-xs text-neutral-500">1 finger: rotate · 2 fingers: move X/Y · pinch: move Z</Text>
          <AxisControls transform={transform} onChange={setTransform} />
        </>
      ) : (
        <View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
          <Text className="text-sm text-neutral-500">Pick a .glb from your phone to render it here</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
