import { File } from 'expo-file-system';
import { Mesh, type AnimationClip, type Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { fitToView } from '@/lib/viewer3d/fitToView';
import type { ModelStats } from '@/types/viewer';

export type LoadedModel = { scene: Object3D; animations: AnimationClip[]; stats: ModelStats };

function countGeometry(root: Object3D): { meshes: number; triangles: number } {
  let meshes = 0;
  let triangles = 0;
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    meshes += 1;
    const geometry = node.geometry;
    const vertices = geometry.index ? geometry.index.count : (geometry.getAttribute('position')?.count ?? 0);
    triangles += Math.floor(vertices / 3);
  });
  return { meshes, triangles };
}

/**
 * Loads a binary glTF (.glb) from a local file URI into a static, view-fitted scene.
 * Animation clips are counted but never attached to a mixer, so the model stays exactly as authored.
 * @param uri local file:// URI (e.g. from expo-document-picker with copyToCacheDirectory)
 * @param fileName display name for stats
 */
export async function loadGlb(uri: string, fileName: string): Promise<LoadedModel> {
  const started = Date.now();
  const bytes = await new File(uri).bytes();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  const gltf = await new GLTFLoader().parseAsync(buffer, '');
  const scene = fitToView(gltf.scene);
  return {
    animations: gltf.animations,
    scene,
    stats: {
      fileName,
      sizeBytes: bytes.byteLength,
      ...countGeometry(scene),
      ignoredAnimations: gltf.animations.length,
      loadMs: Date.now() - started,
    },
  };
}
