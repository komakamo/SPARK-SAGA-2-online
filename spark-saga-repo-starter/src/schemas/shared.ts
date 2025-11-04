import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const resistanceKeyEnum = z.enum([
  'slash',
  'pierce',
  'blunt',
  'fire',
  'ice',
  'lightning',
  'wind',
  'earth',
  'water',
  'holy',
  'dark',
  'poison_resistance',
  'bleed_resistance',
  'paralysis_resistance',
  'stun_resistance',
  'sleep_resistance',
  'confusion_resistance',
  'silence_resistance',
  'petrification_resistance',
  'freeze_resistance',
  'burn_resistance',
]);

const resistanceShape = {
  slash: z.number().min(0).optional(),
  pierce: z.number().min(0).optional(),
  blunt: z.number().min(0).optional(),
  fire: z.number().min(0).optional(),
  ice: z.number().min(0).optional(),
  lightning: z.number().min(0).optional(),
  wind: z.number().min(0).optional(),
  earth: z.number().min(0).optional(),
  water: z.number().min(0).optional(),
  holy: z.number().min(0).optional(),
  dark: z.number().min(0).optional(),
  poison_resistance: z.number().min(0).optional(),
  bleed_resistance: z.number().min(0).optional(),
  paralysis_resistance: z.number().min(0).optional(),
  stun_resistance: z.number().min(0).optional(),
  sleep_resistance: z.number().min(0).optional(),
  confusion_resistance: z.number().min(0).optional(),
  silence_resistance: z.number().min(0).optional(),
  petrification_resistance: z.number().min(0).optional(),
  freeze_resistance: z.number().min(0).optional(),
  burn_resistance: z.number().min(0).optional(),
};

export const combatantStatsSchema = z.object({
  maxHp: z.number().int().positive(),
  maxLp: z.number().int().min(0),
  maxWp: z.number().int().min(0),
  maxJp: z.number().int().min(0),
  speed: z.number().min(0),
  weaponAttack: z.number().min(0),
  strength: z.number().min(0),
  defense: z.number().min(0),
  staffCorrection: z.number().min(0),
  intelligence: z.number().min(0),
  magicDefense: z.number().min(0),
  dexterity: z.number().min(0),
  agility: z.number().min(0),
  criticalChance: z.number().min(0),
});

export const resistancesSchema = z
  .object(resistanceShape)
  .partial()
  .default({});
