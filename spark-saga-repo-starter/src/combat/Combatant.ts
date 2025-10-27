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
  public hasRevived: boolean;

  constructor(
    maxHp: number,
    maxLp: number,
    maxWp: number,
    maxJp: number,
    speed: number,
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
    this.hasRevived = false;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  takeDamage(damage: number): { revived: boolean } {
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

  reset(): void {
    this.hp = this.maxHp;
    this.lp = this.maxLp;
    this.wp = this.maxWp;
    this.jp = this.maxJp;
    this.hasRevived = false;
  }
}
