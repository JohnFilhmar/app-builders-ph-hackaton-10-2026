import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { RunResult } from '@/types/results';

type RunInput = Omit<RunResult, 'id' | 'created_at' | 'device_model' | 'device_ram_gb' | 'platform' | 'score'>;

/**
 * Stamps a run with id, timestamp and device info so rows from different phones compare in one table.
 * @param input the task-specific fields of the run
 */
export function makeRun(input: RunInput): RunResult {
  return {
    ...input,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    device_model: `${Device.manufacturer ?? ''} ${Device.modelName ?? 'unknown'}`.trim(),
    device_ram_gb: Device.totalMemory ? Math.round((Device.totalMemory / 1024 ** 3) * 10) / 10 : null,
    platform: `${Platform.OS} ${String(Platform.Version)}`,
    score: null,
  };
}
