import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const factionEffectSchema = z.object({
  unlock_quest_id: idSchema,
  // Add other faction effect properties here
});

export const factionThresholdSchema = z.object({
  reputation: z.number().int(),
  effects: z.array(factionEffectSchema),
});

export const factionSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  thresholds: z.array(factionThresholdSchema),
});

export const factionsSchema = z.array(factionSchema);
