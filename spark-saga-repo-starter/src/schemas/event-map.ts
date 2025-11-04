import { z } from 'zod';

const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const eventMapEffectSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('log'),
    message: z.string(),
  }),
  z.object({
    type: z.literal('give_item'),
    itemId: idSchema,
    quantity: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('set_flag'),
    flagId: z.string(),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal('quest_update'),
    questId: idSchema,
    state: z.string(),
  }),
]);

const baseEventMapEntrySchema = z.object({
  id: idSchema,
  tileEventId: z.number().int().positive(),
  label: z.string().optional(),
  repeatable: z.boolean().default(true),
  cooldownMs: z.number().int().nonnegative().optional(),
  effects: z.array(eventMapEffectSchema).default([]),
});

const conversationEventSchema = baseEventMapEntrySchema.extend({
  type: z.literal('conversation'),
  conversationId: idSchema,
});

const treasureEventSchema = baseEventMapEntrySchema.extend({
  type: z.literal('treasure'),
});

const gatheringEventSchema = baseEventMapEntrySchema.extend({
  type: z.literal('gathering'),
});

export const eventMapEntrySchema = z.discriminatedUnion('type', [
  conversationEventSchema,
  treasureEventSchema,
  gatheringEventSchema,
]);

export const eventMapSchema = z.array(eventMapEntrySchema);

export type EventMapEntry = z.infer<typeof eventMapEntrySchema>;
export type EventMapEffect = z.infer<typeof eventMapEffectSchema>;
