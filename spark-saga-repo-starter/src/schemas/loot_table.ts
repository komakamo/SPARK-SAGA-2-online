import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const lootEntrySchema = z.object({
  item_id: idSchema,
  quantity: z.number().int().positive(),
  chance: z.number().min(0).max(1),
});

export const lootTableSchema = z.object({
  id: idSchema,
  entries: z.array(lootEntrySchema),
});

export const lootTablesSchema = z.array(lootTableSchema);
