import { z } from 'zod';

export const modelFileSchema = z.object({
  role: z.enum(['model', 'mmproj']),
  url: z.url(),
  file_name: z.string().min(1),
  size_bytes: z.number().int().positive(),
  sha256: z.string().length(64).optional(),
});

/** A downloadable choice for one capability. Model specifics stay in `files`; the UI only shows label, pros and cons. */
export const tierSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  summary: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  recommended: z.boolean(),
  /** the phone needs at least this much RAM; tiers above the phone's RAM are shown locked with the reason */
  min_ram_gb: z.number().positive(),
  runtime: z.enum(['llama', 'whisper']),
  files: z.array(modelFileSchema).min(1),
});

export const CAPABILITIES = ['brain', 'eyes', 'ears'] as const;

/** The one schema for the tier catalog served by the backend at /tara/catalog. */
export const taraCatalogSchema = z.object({
  version: z.string(),
  capabilities: z.array(
    z.object({
      id: z.enum(CAPABILITIES),
      label: z.string(),
      purpose: z.string(),
      tiers: z.array(tierSchema).min(1),
    }),
  ),
});

export type ModelFile = z.infer<typeof modelFileSchema>;
export type Tier = z.infer<typeof tierSchema>;
export type CapabilityId = (typeof CAPABILITIES)[number];
export type TaraCatalog = z.infer<typeof taraCatalogSchema>;

/** What the download and runtime modules need from a tier. */
export type CatalogModel = Pick<Tier, 'id' | 'runtime' | 'files'>;
