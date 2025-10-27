import { describe, it, expect, beforeEach } from 'vitest';
import { Combatant } from './Combatant';
import { StatusEffect as StatusEffectDefinition } from '../schemas/status-effect';

describe('ActiveStatusEffect', () => {
  let combatant: Combatant;
  const poisonEffectDefinition: StatusEffectDefinition = {
    id: 'poison',
    name: 'Poison',
    duration: 3,
    effects: [
      {
        type: 'damage_over_time',
        stat: 'hp',
        value: 10,
      },
    ],
    resistanceTags: ['poison_resistance'],
  };

  const strengthDebuffDefinition: StatusEffectDefinition = {
    id: 'weaken',
    name: 'Weaken',
    duration: 2,
    effects: [
      {
        type: 'stat_change',
        stat: 'strength',
        value: -5,
      },
    ],
    resistanceTags: [],
  };

  const stunEffectDefinition: StatusEffectDefinition = {
    id: 'stun',
    name: 'Stun',
    duration: 1,
    effects: [{ type: 'prevent_action' }],
    resistanceTags: ['stun_resistance'],
  };

  beforeEach(() => {
    combatant = new Combatant(100, 1, 50, 50, 10, 20, 15, 10, 0, 0, 0, 12, 10, 0.05);
  });

  it('should apply damage over time correctly', () => {
    combatant.addStatusEffect(poisonEffectDefinition);

    // Turn 1
    combatant.updateStatusEffects();
    expect(combatant.hp).toBe(90);

    // Turn 2
    combatant.updateStatusEffects();
    expect(combatant.hp).toBe(80);

    // Turn 3: Effect expires and is removed
    combatant.updateStatusEffects();
    expect(combatant.hp).toBe(70);
    expect(combatant.statusEffects.length).toBe(0);
  });

  it('should apply and remove stat changes correctly', () => {
    // Initial state
    expect(combatant.strength).toBe(15);

    // Apply effect
    combatant.addStatusEffect(strengthDebuffDefinition);
    expect(combatant.strength).toBe(10);

    // Turn 1: Effect is active
    combatant.updateStatusEffects();
    expect(combatant.strength).toBe(10);
    expect(combatant.statusEffects[0].duration).toBe(1);

    // Turn 2: Effect expires and is removed
    combatant.updateStatusEffects();
    expect(combatant.strength).toBe(15);
    expect(combatant.statusEffects.length).toBe(0);
  });

  it('should prevent actions when stunned', () => {
    combatant.addStatusEffect(stunEffectDefinition);
    expect(combatant.canAct()).toBe(false);

    combatant.updateStatusEffects();
    expect(combatant.canAct()).toBe(true);
    expect(combatant.statusEffects.length).toBe(0);
  });

  it('should resist status effects', () => {
    combatant.resistances.poison_resistance = 1.0; // 100% resistance
    combatant.addStatusEffect(poisonEffectDefinition);
    expect(combatant.statusEffects.length).toBe(0);
  });
});
