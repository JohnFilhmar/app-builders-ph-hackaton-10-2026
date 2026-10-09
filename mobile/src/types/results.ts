import type { Lang, Task } from '@/types/catalog';

/** Where inference ran: on the phone, or on the laptop over the LAN for comparison. */
export type ExecutionTarget = 'phone' | 'lan';

/** One benchmark run. Field names are snake_case because the row is POSTed to the backend as-is. */
export type RunResult = {
  id: string;
  created_at: string;
  device_model: string;
  device_ram_gb: number | null;
  platform: string;
  task: Task;
  model_id: string;
  target: ExecutionTarget;
  lang: Lang;
  input: string;
  output: string;
  load_ms: number | null;
  latency_ms: number;
  tokens_per_s: number | null;
  /** Audio seconds per processing second; above 1 means faster than real time. */
  realtime_factor: number | null;
  /** Human quality score 1-5, set after reading or hearing the output. */
  score: number | null;
  error: string | null;
};
