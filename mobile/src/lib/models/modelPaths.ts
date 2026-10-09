import ReactNativeBlobUtil from 'react-native-blob-util';

import type { CatalogModel, ModelFile } from '@/types/catalog';

export const MODELS_DIR = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/models`;

/**
 * Absolute on-device path for one catalog file (no file:// prefix).
 * @param file catalog file entry
 */
export function modelFilePath(file: ModelFile): string {
  return `${MODELS_DIR}/${file.file_name}`;
}

/**
 * True when every file of the model exists with the catalog size. Cheap: no hashing.
 * @param model catalog model
 */
export async function isModelOnDisk(model: CatalogModel): Promise<boolean> {
  for (const file of model.files) {
    const path = modelFilePath(file);
    if (!(await ReactNativeBlobUtil.fs.exists(path))) return false;
    const stat = await ReactNativeBlobUtil.fs.stat(path);
    if (Number(stat.size) !== file.size_bytes) return false;
  }
  return true;
}
