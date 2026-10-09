import { useCallback, useEffect } from 'react';

import { deleteModel, downloadModel } from '@/lib/models/modelDownload';
import { isModelOnDisk } from '@/lib/models/modelPaths';
import { useModelStatus, useModelStatusStore, type ModelStatus } from '@/lib/stores/modelStatusStore';
import type { CatalogModel } from '@/types/catalog';
import { errorMessage } from '@/utils/errorMessage';

type UseModelFiles = ModelStatus & {
  /** true when the model has no files to fetch (system TTS) or ExecuTorch fetches its own */
  isSelfManaged: boolean;
  download: () => void;
  remove: () => void;
};

/**
 * Disk status plus download/delete actions for one catalog model. Checks the disk on mount.
 * @param model catalog model, or undefined while nothing is selected
 */
export function useModelFiles(model: CatalogModel | undefined): UseModelFiles {
  const status = useModelStatus(model?.id);
  const setStatus = useModelStatusStore((s) => s.setStatus);
  const isSelfManaged = !model || model.files.length === 0;

  useEffect(() => {
    if (!model || isSelfManaged) return;
    if (status.state !== 'unknown') return;
    void isModelOnDisk(model).then((onDisk) => setStatus(model.id, { state: onDisk ? 'ready' : 'missing' }));
  }, [model, isSelfManaged, status.state, setStatus]);

  const download = useCallback(() => {
    if (!model || isSelfManaged) return;
    setStatus(model.id, { state: 'downloading', progress: 0, error: null });
    downloadModel(model, {
      onProgress: (progress) => setStatus(model.id, { progress }),
      onVerifying: () => setStatus(model.id, { state: 'verifying' }),
    })
      .then(() => setStatus(model.id, { state: 'ready', progress: 1 }))
      .catch((err: unknown) => setStatus(model.id, { state: 'error', error: errorMessage(err) }));
  }, [model, isSelfManaged, setStatus]);

  const remove = useCallback(() => {
    if (!model || isSelfManaged) return;
    void deleteModel(model).then(() => setStatus(model.id, { state: 'missing', progress: 0 }));
  }, [model, isSelfManaged, setStatus]);

  return { ...status, state: isSelfManaged ? 'ready' : status.state, isSelfManaged, download, remove };
}
