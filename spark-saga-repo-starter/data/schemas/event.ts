import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const eventNodeSchema = z.object({
  id: idSchema,
  quest_id: idSchema,
  // Add other event node properties here
});

export const eventSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  nodes: z.array(eventNodeSchema),
});

export const eventsSchema = z.array(eventSchema);
