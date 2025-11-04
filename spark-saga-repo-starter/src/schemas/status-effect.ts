import { z } from 'zod';

export const statusEffectSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string(),
  duration: z.number().int().positive(),
  effects: z.array(
    z.object({
      type: z.enum([
        'damage_over_time',
        'stat_change',
        'prevent_action',
        'disable_magic',
        'confuse'
      ]),
      stat: z.optional(z.enum(['hp', 'wp', 'jp', 'strength', 'defense', 'intelligence', 'magicDefense', 'speed', 'dexterity', 'agility'])),
      value: z.optional(z.number()),
    })
  ),
  resistanceTags: z.array(z.string()),
});

export type StatusEffect = z.infer<typeof statusEffectSchema>;
export const statusEffectsSchema = z.array(statusEffectSchema);
