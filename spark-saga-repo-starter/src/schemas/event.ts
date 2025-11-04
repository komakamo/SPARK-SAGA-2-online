import { z } from 'zod';

export const eventIdSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

// Condition schema
const whenSchema = z.object({
  region: z.string().optional(),
  er_gte: z.number().optional(),
  flags_has: z.array(z.string()).optional(),
  party_has: z.array(z.string()).optional(),
  item_has: z.object({ id: z.string(), quantity: z.number() }).optional(),
}).optional();

// Node schemas
const dialogNodeSchema = z.object({
  id: eventIdSchema,
  type: z.literal('dialog'),
  text: z.string(), // i18n key
  next: z.string().nullable(),
  when: whenSchema,
});

const choiceNodeSchema = z.object({
  id: eventIdSchema,
  type: z.literal('choice'),
  choices: z.array(z.object({ text: z.string(), next: z.string() })),
  when: whenSchema,
});

const setFlagNodeSchema = z.object({
  id: eventIdSchema,
  type: z.literal('set_flag'),
  flag: z.string(),
  value: z.boolean(),
  next: z.string().nullable(),
  when: whenSchema,
});

const gotoNodeSchema = z.object({
  id: eventIdSchema,
  type: z.literal('goto'),
  target: z.string(),
  when: whenSchema,
});

const questStartNodeSchema = z.object({
  id: eventIdSchema,
  type: z.literal('quest_start'),
  quest_id: eventIdSchema,
  next: z.string().nullable(),
  when: whenSchema,
});

const questUpdateNodeSchema = z.object({
  id: eventIdSchema,
  type: z.literal('quest_update'),
  quest_id: eventIdSchema,
  quest_state: z.string(),
  next: z.string().nullable(),
  when: whenSchema,
});

const battleNodeSchema = z.object({
  id: eventIdSchema,
  type: z.literal('battle'),
  encounter_id: eventIdSchema,
  on_win: z.string(),
  on_lose: z.string(),
  when: whenSchema,
});

const rewardNodeSchema = z.object({
  id: eventIdSchema,
  type: z.literal('reward'),
  item_id: eventIdSchema,
  quantity: z.number(),
  next: z.string().nullable(),
  when: whenSchema,
});

export const eventNodeSchema = z.discriminatedUnion('type', [
  dialogNodeSchema,
  choiceNodeSchema,
  setFlagNodeSchema,
  gotoNodeSchema,
  questStartNodeSchema,
  questUpdateNodeSchema,
  battleNodeSchema,
  rewardNodeSchema,
]);

export const eventSchema = z.object({
  id: eventIdSchema,
  name: z.string(),
  description: z.string(),
  nodes: z.array(eventNodeSchema),
});

export const eventsSchema = z.array(eventSchema);

export type EventNode = z.infer<typeof eventNodeSchema>;
export type Event = z.infer<typeof eventSchema>;
