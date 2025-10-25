import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const shopItemSchema = z.object({
  id: idSchema,
  type: z.enum(['item', 'weapon', 'armor']),
  price: z.number().int().nonnegative(),
});

export const shopSchema = z.object({
  id: idSchema,
  name: z.string(),
  items: z.array(shopItemSchema),
});

export const shopsSchema = z.array(shopSchema);
