import { describe, it, expect, vi } from 'vitest';

vi.mock('../data-loader', () => ({
  gameData: {
    formation: {
      byId: new Map([
        [
          'square',
          {
            id: 'square',
            modifiers: {
              front: {},
              back: {},
            },
          },
        ],
      ]),
    },
    balance: {
      physical_damage: {
        weapon_attack_coefficient: 1,
        strength_coefficient: 1,
        defense_factor: 100,
      },
      magical_damage: {
        staff_correction_coefficient: 1,
        intelligence_coefficient: 1,
        magic_defense_factor: 100,
      },
    },
  },
}));

import { Combatant } from './Combatant';

describe('Statistical Tests for Combat', () => {
  it('should produce a distribution of outcomes that aligns with theoretical probabilities', () => {
    const attacker = new Combatant(100, 1, 50, 50, 10, 20, 15, 10, 0, 0, 0, 12, 10, 0.25);
    const defender = new Combatant(100, 1, 50, 50, 10, 15, 12, 8, 0, 0, 0, 8, 8, 0);

    const numSimulations = 10000;
    const outcomes = {
      Miss: 0,
      Hit: 0,
      Critical: 0,
    };

    const baseHitChance = 1.0 + (attacker.dexterity - defender.agility) * 0.02;
    const clampedHitChance = Math.max(0, Math.min(1, baseHitChance));
    const clampedCriticalChance = Math.min(0.3, attacker.criticalChance);

    const expected = {
      Miss: (1 - clampedHitChance) * numSimulations,
      Hit: clampedHitChance * (1 - clampedCriticalChance) * numSimulations,
      Critical: clampedHitChance * clampedCriticalChance * numSimulations,
    };

    for (let i = 0; i < numSimulations; i++) {
      const { outcome } = defender.calculateHitEvasionAndCritical(attacker, 1.0);
      outcomes[outcome]++;
    }

    const tolerance = numSimulations * 0.02; // 2% tolerance

    console.table({
      'Outcome': ['Miss', 'Hit', 'Critical'],
      'Actual': [outcomes.Miss, outcomes.Hit, outcomes.Critical],
      'Expected': [Math.round(expected.Miss), Math.round(expected.Hit), Math.round(expected.Critical)],
      'Difference': [
        Math.abs(outcomes.Miss - expected.Miss),
        Math.abs(outcomes.Hit - expected.Hit),
        Math.abs(outcomes.Critical - expected.Critical),
      ],
      'Tolerance': [tolerance, tolerance, tolerance],
      'Within Tolerance': [
        Math.abs(outcomes.Miss - expected.Miss) <= tolerance,
        Math.abs(outcomes.Hit - expected.Hit) <= tolerance,
        Math.abs(outcomes.Critical - expected.Critical) <= tolerance,
      ],
    });

    expect(Math.abs(outcomes.Miss - expected.Miss)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(outcomes.Hit - expected.Hit)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(outcomes.Critical - expected.Critical)).toBeLessThanOrEqual(tolerance);
  });
});
