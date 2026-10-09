import { z } from 'zod';

export const TASKS = ['chat', 'translate', 'stt', 'tts', 'describe', 'image_gen'] as const;
export const RUNTIMES = ['llama', 'whisper', 'kokoro', 'sdxs', 'system_tts'] as const;
export const LANGS = ['en', 'tl'] as const;

const promptSetSchema = z.object({ en: z.array(z.string()), tl: z.array(z.string()) });

export const modelFileSchema = z.object({
  role: z.enum(['model', 'mmproj']),
  url: z.url(),
  file_name: z.string().min(1),
  size_bytes: z.number().int().positive(),
  sha256: z.string().length(64).optional(),
});

export const catalogModelSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  tasks: z.array(z.enum(TASKS)).min(1),
  runtime: z.enum(RUNTIMES),
  languages: z.array(z.enum(LANGS)),
  license: z.string(),
  notes: z.string().default(''),
  files: z.array(modelFileSchema),
});

/** The one schema for the model catalog served by the backend and bundled as fallback. */
export const catalogSchema = z.object({
  version: z.string(),
  defaults: z.partialRecord(z.enum(TASKS), z.string()),
  models: z.array(catalogModelSchema),
  prompts: z.partialRecord(z.enum(TASKS), promptSetSchema),
  commands: z.array(z.object({ intent: z.string(), phrases: z.array(z.string()) })),
});

export type Task = (typeof TASKS)[number];
export type Runtime = (typeof RUNTIMES)[number];
export type Lang = (typeof LANGS)[number];
export type ModelFile = z.infer<typeof modelFileSchema>;
export type CatalogModel = z.infer<typeof catalogModelSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
