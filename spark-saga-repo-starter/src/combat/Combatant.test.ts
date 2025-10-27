import { describe, it, expect } from 'vitest';
import { Combatant } from './Combatant';

describe('Combatant', () => {
  it('should revive with LP when HP reaches 0 for the first time', () => {
    const combatant = new Combatant(100, 1, 50, 50, 10);
    const { revived } = combatant.takeDamage(100);

    expect(revived).toBe(true);
    expect(combatant.hp).toBe(20);
    expect(combatant.lp).toBe(0);
    expect(combatant.hasRevived).toBe(true);
  });

  it('should not revive a second time in the same battle', () => {
    const combatant = new Combatant(100, 2, 50, 50, 10);
    combatant.takeDamage(100); // First death
    const { revived } = combatant.takeDamage(20); // Second death

    expect(revived).toBe(false);
    expect(combatant.hp).toBe(0);
    expect(combatant.lp).toBe(1);
    expect(combatant.hasRevived).toBe(true);
  });

  it('should not revive if LP is 0', () => {
    const combatant = new Combatant(100, 0, 50, 50, 10);
    const { revived } = combatant.takeDamage(100);

    expect(revived).toBe(false);
    expect(combatant.hp).toBe(0);
    expect(combatant.lp).toBe(0);
    expect(combatant.hasRevived).toBe(false);
  });
});
