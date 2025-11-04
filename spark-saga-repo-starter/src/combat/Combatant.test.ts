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

describe('Combatant', () => {
  it('should revive with LP when HP reaches 0 for the first time', () => {
    const combatant = new Combatant(100, 1, 50, 50, 10, 20, 15, 10);
    const { revived } = combatant.applyDamage(100);

    expect(revived).toBe(true);
    expect(combatant.hp).toBe(20);
    expect(combatant.lp).toBe(0);
    expect(combatant.hasRevived).toBe(true);
  });

  it('should not revive a second time in the same battle', () => {
    const combatant = new Combatant(100, 2, 50, 50, 10, 20, 15, 10);
    combatant.applyDamage(100); // First death
    const { revived } = combatant.applyDamage(20); // Second death

    expect(revived).toBe(false);
    expect(combatant.hp).toBe(0);
    expect(combatant.lp).toBe(1);
    expect(combatant.hasRevived).toBe(true);
  });

  it('should not revive if LP is 0', () => {
    const combatant = new Combatant(100, 0, 50, 50, 10, 20, 15, 10);
    const { revived } = combatant.applyDamage(100);

    expect(revived).toBe(false);
    expect(combatant.hp).toBe(0);
    expect(combatant.lp).toBe(0);
    expect(combatant.hasRevived).toBe(false);
  });
});

describe('Critical Chance Clamping', () => {
  it('should clamp critical chance to 30% if the raw value is higher', () => {
    const attacker = new Combatant(100, 1, 50, 50, 10, 20, 15, 10, 0, 0, 0, 12, 10, 0.5); // 50% crit
    const defender = new Combatant(100, 1, 50, 50, 10, 20, 15, 10);
    const { criticalChance } = defender.calculateHitEvasionAndCritical(attacker);
    expect(criticalChance).toBeLessThanOrEqual(0.3);
  });
});

describe('Hit Chance Clamping', () => {
  it('should clamp hit chance to 100% even with high dexterity', () => {
    const attacker = new Combatant(100, 1, 50, 50, 10, 20, 15, 10, 0, 0, 0, 100, 0, 0); // High dexterity
    const defender = new Combatant(100, 1, 50, 50, 10, 20, 15, 10);
    const outcomes = { Miss: 0, Hit: 0, Critical: 0 };
    for (let i = 0; i < 1000; i++) {
      const { outcome } = defender.calculateHitEvasionAndCritical(attacker);
      outcomes[outcome]++;
    }
    expect(outcomes.Miss).toBe(0);
  });

  it('should clamp hit chance to 0% with very low dexterity', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const attacker = new Combatant(100, 1, 50, 50, 10, 20, 15, 10, 0, 0, 0, 0, 100, 0);
    const defender = new Combatant(100, 1, 50, 50, 10, 0, 0, 0, 0, 0, 0, 0, 100, 0);
    const { outcome } = defender.calculateHitEvasionAndCritical(attacker);
    expect(outcome).toBe('Miss');
    randomSpy.mockRestore();
  });
});
