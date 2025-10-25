import { z } from 'zod';

export const balanceSchema = z.object({
  affix_keys: z.array(z.string()),
  player_base_stats: z.object({
    hp: z.number().int().positive(),
    attack: z.number().int().positive(),
    defense: z.number().int().positive(),
  }),
  level_up_multipliers: z.object({
    hp: z.number().positive(),
    attack: z.number().positive(),
    defense: z.number().positive(),
  }),
  demand_index_range: z.object({
    min: z.literal(-10),
    max: z.literal(10),
  }),
  crit_chance_max: z.number().max(0.3),
});
