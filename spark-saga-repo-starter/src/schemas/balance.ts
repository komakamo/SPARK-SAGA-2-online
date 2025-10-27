import { z } from 'zod';

export const balanceSchema = z.object({
  physical_damage: z.object({
    weapon_attack_coefficient: z.number(),
    strength_coefficient: z.number(),
    defense_factor: z.number(),
  }),
  magical_damage: z.object({
    staff_correction_coefficient: z.number(),
    intelligence_coefficient: z.number(),
    magic_defense_factor: z.number(),
  }),
});
