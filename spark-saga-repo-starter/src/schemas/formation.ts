import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const formationSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  slots: z.array(z.object({
    x: z.number().int(),
    y: z.number().int(),
  })).max(5),
});

export const formationsSchema = z.array(formationSchema);
