import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const weaponSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  attack: z.number().int().positive(),
  op: z.array(z.string()).optional(),
});

export const weaponsSchema = z.array(weaponSchema);
