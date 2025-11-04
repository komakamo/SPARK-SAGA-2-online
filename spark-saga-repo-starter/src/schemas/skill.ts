import { z } from 'zod';
import { idSchema } from './shared';

const elementEnum = z.enum([
  'slash',
  'pierce',
  'blunt',
  'fire',
  'ice',
  'lightning',
  'wind',
  'earth',
  'water',
  'holy',
  'dark',
]);

export const skillSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  power: z.number().int().positive(),
  element: elementEnum,
  type: z.enum(['physical', 'magical']).default('physical'),
  cost: z
    .object({
      wp: z.number().int().min(0).optional(),
      jp: z.number().int().min(0).optional(),
    })
    .default({}),
  statusEffects: z.array(idSchema).default([]),
});

export const skillsSchema = z.array(skillSchema);

export type Skill = z.infer<typeof skillSchema>;
