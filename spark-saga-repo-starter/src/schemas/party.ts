import { z } from 'zod';
import { combatantStatsSchema, idSchema, resistancesSchema } from './shared';

const commandSchema = z.object({
  id: idSchema,
  name: z.string(),
  type: z.enum(['attack', 'defend', 'skill', 'item']),
  skills: z.array(idSchema).optional(),
  items: z
    .array(
      z.object({
        id: idSchema,
        quantity: z.number().int().positive().default(1),
      }),
    )
    .optional(),
});

const partyMemberSchema = z.object({
  id: idSchema,
  name: z.string(),
  formationPosition: z.enum(['F', 'B']).default('F'),
  stats: combatantStatsSchema,
  resistances: resistancesSchema,
  equipment: z
    .object({
      weapon: idSchema.optional(),
      armor: idSchema.optional(),
    })
    .partial()
    .default({}),
  commands: z.array(commandSchema).min(1),
});

export const partySchema = z.object({
  id: idSchema,
  name: z.string(),
  formation: idSchema,
  members: z.array(partyMemberSchema).min(1),
});

export const partiesSchema = z.array(partySchema);

export type PartyDefinition = z.infer<typeof partySchema>;
export type PartyMemberDefinition = z.infer<typeof partyMemberSchema>;
export type PartyCommandDefinition = z.infer<typeof commandSchema>;
