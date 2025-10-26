export class Combatant {
  public hp: number;
  public maxHp: number;
  public speed: number;

  constructor(maxHp: number, speed: number) {
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.speed = speed;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(damage: number): void {
    this.hp = Math.max(0, this.hp - damage);
  }

  reset(): void {
    this.hp = this.maxHp;
  }
}
