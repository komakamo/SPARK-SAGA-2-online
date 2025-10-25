import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const erEffectSchema = z.object({
  target_id: idSchema,
  effect_type: z.string(),
  value: z.any(), // This can be refined later if needed
});

export const erSchema = z.object({
  effects: z.record(z.string(), z.array(erEffectSchema)),
});
