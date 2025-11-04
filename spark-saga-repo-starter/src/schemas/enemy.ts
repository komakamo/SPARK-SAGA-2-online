import { z } from 'zod';
import { combatantStatsSchema, idSchema, resistancesSchema } from './shared';

export const enemySchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  level: z.number().int().min(1),
  stats: combatantStatsSchema,
  resistances: resistancesSchema,
  skills: z.array(idSchema).default([]),
});

export const enemiesSchema = z.array(enemySchema);

export type Enemy = z.infer<typeof enemySchema>;
