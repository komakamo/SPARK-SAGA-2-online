import { StatusEffect as StatusEffectDefinition } from '../schemas/status-effect';
import { Combatant } from './Combatant';

type Stat = 'hp' | 'wp' | 'jp' | 'strength' | 'defense' | 'intelligence' | 'magicDefense' | 'speed' | 'dexterity' | 'agility';

export class ActiveStatusEffect {
  public definition: StatusEffectDefinition;
  public duration: number;
  private statChanges: Map<Stat, number> = new Map();

  constructor(definition: StatusEffectDefinition) {
    this.definition = definition;
    this.duration = definition.duration;
  }

  onApply(target: Combatant) {
    this.definition.effects.forEach((effect) => {
      if (effect.type === 'stat_change' && effect.stat && effect.value) {
        const stat = effect.stat as Stat;
        const change = effect.value;
        target[stat] += change;
        this.statChanges.set(stat, change);
      }
    });
  }

  onTurnEnd(target: Combatant) {
    this.duration--;

    this.definition.effects.forEach((effect) => {
      if (effect.type === 'damage_over_time' && effect.stat === 'hp' && effect.value) {
        target.applyDamage(effect.value);
      }
    });
  }

  onRemove(target: Combatant) {
    this.statChanges.forEach((change, stat) => {
      target[stat] -= change;
    });
  }

  isExpired(): boolean {
    return this.duration <= 0;
  }

  canAct(): boolean {
    return !this.definition.effects.some(effect => effect.type === 'prevent_action');
  }

  isConfused(): boolean {
    return this.definition.effects.some(effect => effect.type === 'confuse');
  }

  isSilenced(): boolean {
    return this.definition.effects.some(effect => effect.type === 'disable_magic');
  }
}
