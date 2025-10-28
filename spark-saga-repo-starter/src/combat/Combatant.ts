import { gameData } from '../data-loader';
import { StatusEffect as StatusEffectDefinition } from '../schemas/status-effect';
import { ActiveStatusEffect } from './StatusEffect';

type Resistances = {
  slash?: number;
  pierce?: number;
  blunt?: number;
  fire?: number;
  ice?: number;
  lightning?: number;
  holy?: number;
  dark?: number;
  poison_resistance?: number;
  bleed_resistance?: number;
  paralysis_resistance?: number;
  stun_resistance?: number;
  sleep_resistance?: number;
  confusion_resistance?: number;
  silence_resistance?: number;
  petrification_resistance?: number;
  freeze_resistance?: number;
  burn_resistance?: number;
};

export class Combatant {
  public statusEffects: ActiveStatusEffect[];
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
  public dexterity: number;
  public agility: number;
  public criticalChance: number;
  public resistances: Resistances;
  public hasRevived: boolean;
  public formationId: string;
  public formationPosition: 'F' | 'B';

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
    dexterity = 0,
    agility = 0,
    criticalChance = 0,
    resistances: Resistances = {},
    formationId: string = 'square', // Default formation
    formationPosition: 'F' | 'B' = 'F', // Default position
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
    this.dexterity = dexterity;
    this.agility = agility;
    this.criticalChance = criticalChance;
    this.resistances = resistances;
    this.hasRevived = false;
    this.statusEffects = [];
    this.formationId = formationId;
    this.formationPosition = formationPosition;
  }

  private get formationModifiers() {
    const formation = gameData.formation.byId.get(this.formationId);
    if (!formation) return null;

    const row = this.formationPosition === 'F' ? 'front' : 'back';
    return formation.modifiers[row];
  }

  get finalSpeed(): number {
    const mods = this.formationModifiers;
    return this.speed * (1 + (mods?.speed || 0));
  }

  get finalCriticalChance(): number {
    const mods = this.formationModifiers;
    return this.criticalChance + (mods?.critical || 0);
  }

  addStatusEffect(statusEffectDefinition: StatusEffectDefinition): void {
    // Resistance check
    const resistance = statusEffectDefinition.resistanceTags.reduce((acc, tag) => {
      return acc + (this.resistances[tag as keyof Resistances] ?? 0);
    }, 0);

    if (Math.random() < resistance) {
      // Resisted!
      return;
    }

    const existingEffect = this.statusEffects.find(
      (se) => se.definition.id === statusEffectDefinition.id,
    );

    if (existingEffect) {
      // For now, just refresh the duration.
      // More complex rules (stacking, ignoring) could be added here.
      existingEffect.duration = statusEffectDefinition.duration;
    } else {
      const newEffect = new ActiveStatusEffect(statusEffectDefinition);
      this.statusEffects.push(newEffect);
      newEffect.onApply(this);
    }
  }

  canAct(): boolean {
    return this.statusEffects.every(effect => effect.canAct());
  }

  isConfused(): boolean {
    return this.statusEffects.some(effect => effect.isConfused());
  }

  isSilenced(): boolean {
    return this.statusEffects.some(effect => effect.isSilenced());
  }

  updateStatusEffects(): void {
    const remainingEffects: ActiveStatusEffect[] = [];
    for (const effect of this.statusEffects) {
      effect.onTurnEnd(this);
      if (effect.isExpired()) {
        effect.onRemove(this);
      } else {
        remainingEffects.push(effect);
      }
    }
    this.statusEffects = remainingEffects;
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
    let defense = this.defense;

    const attackerMods = attacker.formationModifiers;
    if (attackerMods?.attack) {
        power *= 1 + attackerMods.attack;
    }

    const defenderMods = this.formationModifiers;
    if (defenderMods?.defense) {
        defense *= 1 + defenderMods.defense;
    }


    if (type === 'physical') {
      const pCoeff = balance.physical_damage;
      baseDamage =
        attacker.weaponAttack * pCoeff.weapon_attack_coefficient +
        attacker.strength * pCoeff.strength_coefficient +
        power;
      finalDamage =
        baseDamage *
        (1 - defense / (defense + pCoeff.defense_factor));
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

  calculateHitEvasionAndCritical(
    attacker: Combatant,
    baseHitChance = 1.0,
  ): { outcome: 'Miss' | 'Hit' | 'Critical'; criticalChance: number } {
    const hitChance =
      baseHitChance +
      (attacker.dexterity - this.agility) * 0.02;
    const clampedHitChance = Math.max(0, Math.min(1, hitChance));

    if (Math.random() > clampedHitChance) {
      return { outcome: 'Miss', criticalChance: 0 };
    }

    const criticalChance = Math.min(0.3, attacker.finalCriticalChance);
    if (Math.random() < criticalChance) {
      return { outcome: 'Critical', criticalChance };
    }

    return { outcome: 'Hit', criticalChance };
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
    baseHitChance = 1.0,
    criticalMultiplier = 1.5,
  ): {
    revived: boolean;
    outcome: 'Miss' | 'Hit' | 'Critical';
    damage: number;
  } {
    const { outcome } = this.calculateHitEvasionAndCritical(
      attacker,
      baseHitChance,
    );

    if (outcome === 'Miss') {
      return { revived: false, outcome, damage: 0 };
    }

    let damage = this.calculateDamage(power, attacker, type, damageType);
    if (outcome === 'Critical') {
      damage = Math.round(damage * criticalMultiplier);
    }

    const { revived } = this.applyDamage(damage);
    return { revived, outcome, damage };
  }

  reset(): void {
    this.hp = this.maxHp;
    this.lp = this.maxLp;
    this.wp = this.maxWp;
    this.jp = this.maxJp;
    this.hasRevived = false;
    this.statusEffects.forEach(effect => effect.onRemove(this));
    this.statusEffects = [];
  }
}
