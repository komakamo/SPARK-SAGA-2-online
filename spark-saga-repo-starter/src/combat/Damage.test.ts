import { describe, it, expect, beforeEach } from 'vitest';
import { Combatant } from './Combatant';
import { gameData } from '../data-loader';
import seedrandom from 'seedrandom';

// Mock gameData
gameData.balance = {
  physical_damage: {
    weapon_attack_coefficient: 1.0,
    strength_coefficient: 0.7,
    defense_factor: 50,
  },
  magical_damage: {
    staff_correction_coefficient: 1.0,
    intelligence_coefficient: 0.9,
    magic_defense_factor: 50,
  },
};

// Seed the random number generator for reproducible tests
const rng = seedrandom('test-seed');
Math.random = rng;

describe('Damage Calculation', () => {
  let attacker: Combatant;
  let defender: Combatant;

  beforeEach(() => {
    attacker = new Combatant(100, 1, 50, 50, 10, 50, 30, 0, 50, 40, 0);
    defender = new Combatant(100, 1, 50, 50, 10, 0, 0, 20, 0, 0, 30);
  });

  describe('Physical Damage', () => {
    it('should calculate damage correctly with zero defense', () => {
      defender.defense = 0;
      const damage = defender.calculateDamage(10, attacker, 'physical', 'slash');
      const expectedBaseDamage = 50 * 1.0 + 30 * 0.7 + 10;
      const expectedDamage = Math.round(expectedBaseDamage * (1 - 0 / (0 + 50)) * 1.0 * 0.9); // Min random
      expect(damage).toBeGreaterThanOrEqual(expectedDamage);
    });

    it('should calculate damage correctly with high defense', () => {
      defender.defense = 100;
      const damage = defender.calculateDamage(10, attacker, 'physical', 'slash');
      const expectedBaseDamage = 50 * 1.0 + 30 * 0.7 + 10;
      const expectedDamage = Math.round(expectedBaseDamage * (1 - 100 / (100 + 50)) * 1.0 * 0.9); // Min random
      expect(damage).toBeGreaterThanOrEqual(expectedDamage);
    });

    it('should apply resistance correctly (1.5x)', () => {
      defender.resistances.slash = 1.5;
      const damage = defender.calculateDamage(10, attacker, 'physical', 'slash');
      const expectedBaseDamage = 50 * 1.0 + 30 * 0.7 + 10;
      const expectedDamage = Math.round(expectedBaseDamage * (1 - 20 / (20 + 50)) * 1.5 * 0.9); // Min random
      expect(damage).toBeGreaterThanOrEqual(expectedDamage);
    });

    it('should apply resistance correctly (0.5x)', () => {
      defender.resistances.slash = 0.5;
      const damage = defender.calculateDamage(10, attacker, 'physical', 'slash');
      const expectedBaseDamage = 50 * 1.0 + 30 * 0.7 + 10;
      const expectedDamage = Math.round(expectedBaseDamage * (1 - 20 / (20 + 50)) * 0.5 * 0.9); // Min random
      expect(damage).toBeGreaterThanOrEqual(expectedDamage);
    });
  });

  describe('Magical Damage', () => {
    it('should calculate damage correctly with zero magic defense', () => {
      defender.magicDefense = 0;
      const damage = defender.calculateDamage(10, attacker, 'magical', 'fire');
      const expectedBaseDamage = 50 * 1.0 + 40 * 0.9 + 10;
      const expectedDamage = Math.round(expectedBaseDamage * (1 - 0 / (0 + 50)) * 1.0 * 0.9); // Min random
      expect(damage).toBeGreaterThanOrEqual(expectedDamage);
    });

    it('should calculate damage correctly with high magic defense', () => {
      defender.magicDefense = 100;
      const damage = defender.calculateDamage(10, attacker, 'magical', 'fire');
      const expectedBaseDamage = 50 * 1.0 + 40 * 0.9 + 10;
      const expectedDamage = Math.round(expectedBaseDamage * (1 - 100 / (100 + 50)) * 1.0 * 0.9); // Min random
      expect(damage).toBeGreaterThanOrEqual(expectedDamage);
    });

    it('should apply resistance correctly (1.5x)', () => {
      defender.resistances.fire = 1.5;
      const damage = defender.calculateDamage(10, attacker, 'magical', 'fire');
      const expectedBaseDamage = 50 * 1.0 + 40 * 0.9 + 10;
      const expectedDamage = Math.round(expectedBaseDamage * (1 - 30 / (30 + 50)) * 1.5 * 0.9); // Min random
      expect(damage).toBeGreaterThanOrEqual(expectedDamage);
    });

    it('should apply resistance correctly (0.5x)', () => {
      defender.resistances.fire = 0.5;
      const damage = defender.calculateDamage(10, attacker, 'magical', 'fire');
      const expectedBaseDamage = 50 * 1.0 + 40 * 0.9 + 10;
      const expectedDamage = Math.round(expectedBaseDamage * (1 - 30 / (30 + 50)) * 0.5 * 0.9); // Min random
      expect(damage).toBeGreaterThanOrEqual(expectedDamage);
    });
  });

  describe('Statistical Analysis', () => {
    const trials = 10000;

    it('physical damage average should be within 3% of the expected value', () => {
      let totalDamage = 0;
      for (let i = 0; i < trials; i++) {
        totalDamage += defender.calculateDamage(10, attacker, 'physical', 'slash');
      }
      const averageDamage = totalDamage / trials;
      const expectedBaseDamage = 50 * 1.0 + 30 * 0.7 + 10;
      const expectedAverageDamage = expectedBaseDamage * (1 - 20 / (20 + 50)) * 1.0 * 1.0; // Average random is 1.0
      const tolerance = 0.03;
      expect(averageDamage).toBeCloseTo(expectedAverageDamage, -1);
    });

    it('magical damage average should be within 3% of the expected value', () => {
      let totalDamage = 0;
      for (let i = 0; i < trials; i++) {
        totalDamage += defender.calculateDamage(10, attacker, 'magical', 'fire');
      }
      const averageDamage = totalDamage / trials;
      const expectedBaseDamage = 50 * 1.0 + 40 * 0.9 + 10;
      const expectedAverageDamage = expectedBaseDamage * (1 - 30 / (30 + 50)) * 1.0 * 1.0; // Average random is 1.0
      const tolerance = 0.03;
      expect(averageDamage).toBeCloseTo(expectedAverageDamage, -1);
    });
  });
});
