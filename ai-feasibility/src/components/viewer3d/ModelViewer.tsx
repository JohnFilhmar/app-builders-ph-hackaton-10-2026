import { Canvas } from '@react-three/fiber/native';
import type { Object3D } from 'three';
import { View } from 'react-native';

import { useModelGestures } from '@/hooks/useModelGestures';
import type { ModelTransform } from '@/types/viewer';

type ModelViewerProps = {
  /** static scene to show; never animated */
  scene: Object3D;
  transform: ModelTransform;
  onTransformChange: (next: ModelTransform) => void;
};

/** Renders one static 3D model with touch control of its position and rotation. Fills its parent. */
export function ModelViewer({ scene, transform, onTransformChange }: ModelViewerProps) {
  const gestures = useModelGestures(transform, onTransformChange);
  return (
    <View className="flex-1 overflow-hidden rounded-2xl bg-neutral-800" {...gestures}>
      {/* demand: redraw only when the transform changes, not 60 times a second */}
      <Canvas frameloop="demand" camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.6} />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} />
        <group position={transform.position} rotation={transform.rotation}>
          <primitive object={scene} />
        </group>
      </Canvas>
    </View>
  );
}
