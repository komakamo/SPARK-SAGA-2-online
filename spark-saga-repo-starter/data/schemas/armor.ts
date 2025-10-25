import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const armorSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  defense: z.number().int().positive(),
});

export const armorsSchema = z.array(armorSchema);
