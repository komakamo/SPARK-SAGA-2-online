import { gameData } from '../data-loader';

type Resistances = {
  slash?: number;
  pierce?: number;
  blunt?: number;
  fire?: number;
  ice?: number;
  lightning?: number;
  holy?: number;
  dark?: number;
};

export class Combatant {
  public hp: number;
  public maxHp: number;
  public lp: number;
  public maxLp: number;
  public wp: number;
  public maxWp: number;
  public jp: number;
  public maxJp: number;
  public speed: number;
  public weaponAttack: number;
  public strength: number;
  public defense: number;
  public staffCorrection: number;
  public intelligence: number;
  public magicDefense: number;
  public resistances: Resistances;
  public hasRevived: boolean;

  constructor(
    maxHp: number,
    maxLp: number,
    maxWp: number,
    maxJp: number,
    speed: number,
    weaponAttack = 0,
    strength = 0,
    defense = 0,
    staffCorrection = 0,
    intelligence = 0,
    magicDefense = 0,
    resistances: Resistances = {},
  ) {
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.maxLp = maxLp;
    this.lp = maxLp;
    this.maxWp = maxWp;
    this.wp = maxWp;
    this.maxJp = maxJp;
    this.jp = maxJp;
    this.speed = speed;
    this.weaponAttack = weaponAttack;
    this.strength = strength;
    this.defense = defense;
    this.staffCorrection = staffCorrection;
    this.intelligence = intelligence;
    this.magicDefense = magicDefense;
    this.resistances = resistances;
    this.hasRevived = false;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  calculateDamage(
    power: number,
    attacker: Combatant,
    type: 'physical' | 'magical',
    damageType: keyof Resistances = 'slash',
  ): number {
    const balance = gameData.balance;
    let baseDamage: number;
    let finalDamage: number;

    if (type === 'physical') {
      const pCoeff = balance.physical_damage;
      baseDamage =
        attacker.weaponAttack * pCoeff.weapon_attack_coefficient +
        attacker.strength * pCoeff.strength_coefficient +
        power;
      finalDamage =
        baseDamage *
        (1 - this.defense / (this.defense + pCoeff.defense_factor));
    } else {
      const mCoeff = balance.magical_damage;
      baseDamage =
        attacker.staffCorrection * mCoeff.staff_correction_coefficient +
        attacker.intelligence * mCoeff.intelligence_coefficient +
        power;
      finalDamage =
        baseDamage *
        (1 -
          this.magicDefense / (this.magicDefense + mCoeff.magic_defense_factor));
    }

    const resistance = this.resistances[damageType] ?? 1.0;
    finalDamage *= resistance;

    const randomFactor = Math.random() * 0.2 + 0.9;
    finalDamage *= randomFactor;

    return Math.round(finalDamage);
  }

  applyDamage(damage: number): { revived: boolean } {
    this.hp = Math.max(0, this.hp - damage);
    let revived = false;
    if (this.hp === 0 && this.lp > 0 && !this.hasRevived) {
      this.lp -= 1;
      this.hp = Math.floor(this.maxHp * 0.2); // Revive with 20% HP
      this.hasRevived = true;
      revived = true;
    }
    return { revived };
  }

  takeDamage(
    power: number,
    attacker: Combatant,
    type: 'physical' | 'magical',
    damageType: keyof Resistances = 'slash',
  ): { revived: boolean } {
    const damage = this.calculateDamage(power, attacker, type, damageType);
    return this.applyDamage(damage);
  }

  reset(): void {
    this.hp = this.maxHp;
    this.lp = this.maxLp;
    this.wp = this.maxWp;
    this.jp = this.maxJp;
    this.hasRevived = false;
  }
}
