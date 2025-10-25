import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const itemSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  effect: z.string().optional(),
});

export const itemsSchema = z.array(itemSchema);
