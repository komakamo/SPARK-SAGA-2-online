import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const questRewardSchema = z.object({
  items: z.array(z.object({
    id: idSchema,
    quantity: z.number().int().positive(),
  })),
});

export const questSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  rewards: questRewardSchema,
  // Add other quest properties here
});

export const questsSchema = z.array(questSchema);
