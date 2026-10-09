import { Box3, Vector3, type Object3D } from 'three';

/**
 * Centers a model on the origin and scales it so its largest side is `size` units,
 * so any GLB lands in view regardless of the units it was authored in. Mutates and returns the object.
 * @param object root of the loaded scene
 * @param size target length of the largest bounding-box side
 */
export function fitToView(object: Object3D, size = 2): Object3D {
  const box = new Box3().setFromObject(object);
  const dims = box.getSize(new Vector3());
  const largest = Math.max(dims.x, dims.y, dims.z);
  if (largest > 0) object.scale.multiplyScalar(size / largest);
  const center = new Box3().setFromObject(object).getCenter(new Vector3());
  object.position.sub(center);
  return object;
}
