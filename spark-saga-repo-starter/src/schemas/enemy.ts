import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const enemySchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  level: z.number().int().min(1),
  hp: z.number().int().positive(),
  attack: z.number().int().positive(),
  defense: z.number().int().positive(),
  skills: z.array(idSchema).optional(),
});

export const enemiesSchema = z.array(enemySchema);
