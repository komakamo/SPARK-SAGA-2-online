import { z } from 'zod';
import { combatantStatsSchema, idSchema, resistancesSchema } from './shared';

const encounterEnemySchema = z.object({
  id: idSchema,
  enemyId: idSchema,
  formationPosition: z.enum(['F', 'B']).default('F'),
  stats: combatantStatsSchema.partial().optional(),
  resistances: resistancesSchema.optional(),
});

const rewardItemSchema = z.object({
  id: idSchema,
  quantity: z.number().int().positive().default(1),
});

const encounterRewardsSchema = z.object({
  experience: z.number().int().min(0).default(0),
  gold: z.number().int().min(0).default(0),
  items: z.array(rewardItemSchema).default([]),
  lootTables: z.array(idSchema).default([]),
});

const questProgressSchema = z.object({
  questId: idSchema,
  state: z.enum(['started', 'updated', 'completed']).default('updated'),
});

export const encounterSchema = z.object({
  id: idSchema,
  name: z.string(),
  playerPartyId: idSchema.optional(),
  enemies: z.array(encounterEnemySchema).min(1),
  rewards: encounterRewardsSchema.default({ experience: 0, gold: 0, items: [], lootTables: [] }),
  questProgress: z.array(questProgressSchema).default([]),
});

export const encountersSchema = z.array(encounterSchema);

export type EncounterDefinition = z.infer<typeof encounterSchema>;
export type EncounterEnemyDefinition = z.infer<typeof encounterEnemySchema>;
export type EncounterRewards = z.infer<typeof encounterRewardsSchema>;
export type EncounterQuestProgress = z.infer<typeof questProgressSchema>;
