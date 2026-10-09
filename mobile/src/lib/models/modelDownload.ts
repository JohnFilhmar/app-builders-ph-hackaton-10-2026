import ReactNativeBlobUtil from 'react-native-blob-util';

import { MODELS_DIR, modelFilePath } from '@/lib/models/modelPaths';
import type { CatalogModel } from '@/types/catalog';

type DownloadCallbacks = {
  onProgress: (fraction: number) => void;
  onVerifying: () => void;
};

/**
 * Downloads every file of a model, then checks size and sha256 before moving it into place.
 * Files already present with the right size are skipped. Throws with a readable message on failure.
 * @param model catalog model to fetch
 * @param callbacks progress (0..1 across all files) and verify-phase notifications
 */
export async function downloadModel(model: CatalogModel, callbacks: DownloadCallbacks): Promise<void> {
  if (!(await ReactNativeBlobUtil.fs.isDir(MODELS_DIR))) await ReactNativeBlobUtil.fs.mkdir(MODELS_DIR);
  const totalBytes = model.files.reduce((sum, f) => sum + f.size_bytes, 0);
  let doneBytes = 0;

  for (const file of model.files) {
    const finalPath = modelFilePath(file);
    if ((await ReactNativeBlobUtil.fs.exists(finalPath)) && Number((await ReactNativeBlobUtil.fs.stat(finalPath)).size) === file.size_bytes) {
      doneBytes += file.size_bytes;
      callbacks.onProgress(doneBytes / totalBytes);
      continue;
    }

    const tmpPath = `${finalPath}.part`;
    if (await ReactNativeBlobUtil.fs.exists(tmpPath)) await ReactNativeBlobUtil.fs.unlink(tmpPath);
    // ponytail: restarts a failed file from zero; add Range resume if venue Wi-Fi makes this hurt
    // timeout is an idle limit, so a stalled connection fails into Retry instead of spinning forever
    const res = await ReactNativeBlobUtil.config({ path: tmpPath, fileCache: true, timeout: 60_000 })
      .fetch('GET', file.url)
      .progress({ interval: 500 }, (received) => callbacks.onProgress((doneBytes + Number(received)) / totalBytes));

    const status = res.info().status;
    if (status >= 400) {
      await ReactNativeBlobUtil.fs.unlink(tmpPath);
      throw new Error(`${file.file_name}: HTTP ${status}`);
    }

    callbacks.onVerifying();
    const size = Number((await ReactNativeBlobUtil.fs.stat(tmpPath)).size);
    if (size !== file.size_bytes) {
      await ReactNativeBlobUtil.fs.unlink(tmpPath);
      throw new Error(`${file.file_name}: size ${size}, expected ${file.size_bytes}`);
    }
    if (file.sha256) {
      const hash = await ReactNativeBlobUtil.fs.hash(tmpPath, 'sha256');
      if (hash.toLowerCase() !== file.sha256) {
        await ReactNativeBlobUtil.fs.unlink(tmpPath);
        throw new Error(`${file.file_name}: sha256 mismatch`);
      }
    }
    if (await ReactNativeBlobUtil.fs.exists(finalPath)) await ReactNativeBlobUtil.fs.unlink(finalPath);
    await ReactNativeBlobUtil.fs.mv(tmpPath, finalPath);
    doneBytes += file.size_bytes;
    callbacks.onProgress(doneBytes / totalBytes);
  }
}

/**
 * Removes a model's files from the device to free storage.
 * @param model catalog model to delete
 */
export async function deleteModel(model: CatalogModel): Promise<void> {
  for (const file of model.files) {
    const path = modelFilePath(file);
    if (await ReactNativeBlobUtil.fs.exists(path)) await ReactNativeBlobUtil.fs.unlink(path);
  }
}
