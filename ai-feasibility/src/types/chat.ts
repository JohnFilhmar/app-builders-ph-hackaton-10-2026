export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = { role: ChatRole; content: string };

/** Timing numbers every runtime reports back so runs are comparable. */
export type InferenceMetrics = {
  /** null when the model was already loaded */
  loadMs: number | null;
  latencyMs: number;
  tokensPerS: number | null;
};

export type InferenceOutput = InferenceMetrics & { text: string };
