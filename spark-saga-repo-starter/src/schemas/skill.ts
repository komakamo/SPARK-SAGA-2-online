import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const skillSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  power: z.number().int().positive(),
  element: z.enum(['fire', 'water', 'wind', 'earth']),
});

export const skillsSchema = z.array(skillSchema);
