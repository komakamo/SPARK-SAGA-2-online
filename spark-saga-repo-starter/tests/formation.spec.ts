import { expect, test, vi } from 'vitest';
import { Combatant } from '../src/combat/Combatant';
import { gameData } from '../src/data-loader';

// Mock gameData to avoid loading actual data files
vi.mock('../src/data-loader', () => ({
  gameData: {
    balance: {
      physical_damage: {
        weapon_attack_coefficient: 1,
        strength_coefficient: 1,
        defense_factor: 100,
      },
    },
    formation: {
      byId: new Map([
        [
          'crane_wing',
          {
            id: 'crane_wing',
            name: 'Crane Wing',
            rows: ['B', 'F', 'B'],
            modifiers: {
              front: { attack: 0.1, defense: -0.1 },
              back: { attack: -0.1, defense: 0.1 },
            },
          },
        ],
        [
          'tiger_claw',
          {
            id: 'tiger_claw',
            name: 'Tiger Claw',
            rows: ['F', 'B', 'F'],
            modifiers: {
              front: { attack: 0.2, speed: -0.1 },
              back: { attack: -0.2, speed: 0.1 },
            },
          },
        ],
        [
          'twin_star',
          {
            id: 'twin_star',
            name: 'Twin Star',
            rows: ['F', 'F', 'F'],
            modifiers: {
              front: { attack: 0.1, critical: 0.05 },
              back: {},
            },
          },
        ],
      ]),
    },
  },
}));

test('formation modifiers are applied correctly to damage calculation', () => {
  // Attacker in Tiger Claw (front row, +20% attack)
  const attacker = new Combatant(100, 10, 50, 50, 10, 20, 10, 0, 0, 0, 0, 0, 0, 0, {}, 'tiger_claw', 'F');

  // Defender in Crane Wing (back row, +10% defense)
  const defender = new Combatant(100, 10, 50, 50, 10, 0, 0, 10, 0, 0, 0, 0, 0, 0, {}, 'crane_wing', 'B');

  // Mock Math.random to make the damage calculation deterministic
  vi.spyOn(Math, 'random').mockReturnValue(0.95); // Average random factor

  const damage = defender.calculateDamage(10, attacker, 'physical');

  // Expected damage calculation:
  // Attacker power: 10 * (1 + 0.2) = 12
  // Defender defense: 10 * (1 + 0.1) = 11
  // Base damage = 20 * 1 + 10 * 1 + 12 = 42
  // Random factor = 0.95 * 0.2 + 0.9 = 1.09
  // Final damage = 42 * (1 - 11 / (11 + 100)) * 1.09 = 41.24... ~ 41
  expect(damage).toBe(41);
});

test('formation modifiers are applied correctly to speed', () => {
  // Combatant in Tiger Claw (back row, +10% speed)
  const combatant = new Combatant(100, 10, 50, 50, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, {}, 'tiger_claw', 'B');
  expect(combatant.finalSpeed).toBe(11);
});

test('formation modifiers are applied correctly to critical chance', () => {
  // Combatant in Twin Star (front row, +5% critical)
  const combatant = new Combatant(100, 10, 50, 50, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, {}, 'twin_star', 'F');
  expect(combatant.finalCriticalChance).toBeCloseTo(0.15);
});
