import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

// These are the stats that can be modified by a formation's row bonus.
// Based on the task description: 与被ダメ・命中・行動値・会心・挑発・連携率など
// (damage dealt/received, accuracy, speed, critical, taunt, combo rate)
const modifierStatsSchema = z.object({
  attack: z.number().optional(),
  defense: z.number().optional(),
  speed: z.number().optional(),
  accuracy: z.number().optional(),
  critical: z.number().optional(),
  taunt: z.number().optional(),
  comboRate: z.number().optional(),
}).strict();

export const formationSchema = z.object({
  id: idSchema,
  name: z.string(),
  // Defines the position (Front/Back) for each of the max 5 party members.
  rows: z.array(z.enum(['F', 'B'])).min(1).max(5),
  modifiers: z.object({
    front: modifierStatsSchema,
    back: modifierStatsSchema,
  }),
});

export const formationsSchema = z.array(formationSchema);
