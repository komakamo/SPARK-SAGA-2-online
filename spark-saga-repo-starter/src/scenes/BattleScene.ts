import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';
import { Combatant } from '../combat/Combatant';
import { gameData } from '../data-loader';

export class BattleScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;
  private player: Combatant;
  private enemy: Combatant;
  private turnOrder: Combatant[];
  public battleLog: string[] = [];
  private isPlayerTurn = false;
  private currentTurn: number = 0;
  private logContainer: HTMLElement;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('battle-scene')!;
    this.logContainer = document.getElementById('battle-log-container')!;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.uiManager = uiManager;

    // TODO: Replace with actual data loading
    this.player = new Combatant(100, 1, 50, 50, 10, 20, 15, 10, 0, 0, 0, 12, 10, 0.05);
    this.enemy = new Combatant(80, 1, 30, 30, 8, 15, 12, 8, 0, 0, 0, 8, 8, 0);
    this.turnOrder = [];
  }

  enter(): void {
    this.element.hidden = false;
    this.uiManager.updateHelpDisplay();
    this.uiManager.updatePartyStatus(this.player, this.enemy);
    this.calculateTurnOrder();
    this.log('A wild enemy appears!');
    this.nextTurn();
  }

  exit(): void {
    this.element.hidden = true;
    this.battleLog = [];
    this.turnOrder = [];
    this.currentTurn = 0;
    this.player.reset();
    this.enemy.reset();
  }

  update(deltaTime: number): void {
    if (this.isPlayerTurn) {
      if (this.inputManager.isActionJustPressed(Action.Confirm)) {
        this.attack(this.player, this.enemy);
      }
      if (this.inputManager.isActionJustPressed(Action.Cancel)) {
        this.attemptEscape();
      }
    }
  }

  render(): void {
    // Battle scene rendering
  }

  pause(): void {
    if (import.meta.env.DEV) {
      console.log('BattleScene paused');
    }
  }

  resume(): void {
    if (import.meta.env.DEV) {
      console.log('BattleScene resumed');
    }
  }

  private onVictory(): void {
    this.sceneManager.changeScene('result');
  }

  private onEscape(): void {
    this.sceneManager.changeScene('field');
  }

  private onGameOver(): void {
    this.sceneManager.changeScene('title');
  }

  private attack(attacker: Combatant, target: Combatant): void {
    if (attacker === this.player) {
      // For demonstration, let's say the player's attack has a chance to poison.
      const poisonEffect = gameData.statusEffects.all.find(se => se.id === 'poison');
      if (poisonEffect && Math.random() < 0.3) { // 30% chance to poison
        target.addStatusEffect(poisonEffect);
        this.log(`${target === this.player ? 'Player' : 'Enemy'} has been poisoned!`);
      }
    }

    const { revived, outcome, damage } = target.takeDamage(
      10,
      attacker,
      'physical',
      'slash',
    );
    const attackerName = attacker === this.player ? 'Player' : 'Enemy';
    const targetName = target === this.player ? 'Player' : 'Enemy';

    if (outcome === 'Miss') {
      this.log(`${attackerName}'s attack missed ${targetName}.`);
    } else if (outcome === 'Critical') {
      this.log(`Critical hit! ${attackerName} deals ${damage} damage to ${targetName}.`);
    } else {
      this.log(`${attackerName} deals ${damage} damage to ${targetName}.`);
    }

    if (attacker === this.player) {
      attacker.wp -= 5; // Placeholder WP cost
      this.log('Player uses 5 WP.');
    } else {
      attacker.jp -= 5; // Placeholder JP cost
      this.log('Enemy uses 5 JP.');
    }
    this.uiManager.updatePartyStatus(this.player, this.enemy);
    if (revived) {
      this.log(`${target === this.player ? 'Player' : 'Enemy'} revived with LP!`);
    }
    this.nextTurn();
  }

  private attemptEscape(): void {
    if (Math.random() < 0.5) { // 50% chance to escape
      this.log('Successfully escaped!');
      this.onEscape();
    } else {
      this.log('Failed to escape!');
      this.nextTurn();
    }
  }

  private nextTurn(): void {
    if (!this.enemy.isAlive()) {
        this.log('Enemy defeated!');
        this.onVictory();
        return;
    }
    if (!this.player.isAlive()) {
        this.log('You have been defeated!');
        this.onGameOver();
        return;
    }

    const currentCombatant = this.turnOrder[this.currentTurn];
    this.currentTurn = (this.currentTurn + 1) % this.turnOrder.length;

    // Apply status effects at the start of the turn
    currentCombatant.updateStatusEffects();
    this.logStatusEffects(currentCombatant);

    if (!currentCombatant.canAct()) {
        const combatantName = currentCombatant === this.player ? 'Player' : 'Enemy';
        this.log(`${combatantName} cannot act!`);
        this.nextTurn();
        return;
    }

    if (currentCombatant.isConfused()) {
        const combatantName = currentCombatant === this.player ? 'Player' : 'Enemy';
        this.log(`${combatantName} is confused!`);
        const target = Math.random() < 0.5 ? this.player : this.enemy;
        this.attack(currentCombatant, target);
        return;
    }

    if (currentCombatant === this.player) {
        this.isPlayerTurn = true;
        this.log('Your turn.');
    } else {
        this.isPlayerTurn = false;
        this.log("Enemy's turn.");
        // Simple AI: attack the player
        setTimeout(() => this.attack(this.enemy, this.player), 1000);
    }
  }

  private logStatusEffects(combatant: Combatant): void {
    const combatantName = combatant === this.player ? 'Player' : 'Enemy';
    combatant.statusEffects.forEach(effect => {
      effect.definition.effects.forEach(def => {
        if (def.type === 'damage_over_time') {
          this.log(`${combatantName} takes ${def.value} damage from ${effect.definition.name}.`);
        }
      });
    });
    this.uiManager.updatePartyStatus(this.player, this.enemy);
  }

  private calculateTurnOrder(): void {
    const playerSpeed = this.player.speed * (Math.random() * 0.3 + 0.85);
    const enemySpeed = this.enemy.speed * (Math.random() * 0.3 + 0.85);

    if (playerSpeed >= enemySpeed) {
      this.turnOrder = [this.player, this.enemy];
    } else {
      this.turnOrder = [this.enemy, this.player];
    }
  }

  private log(message: string): void {
    this.battleLog.push(message);
    this.updateLog();
    console.log(message);
  }

  private updateLog(): void {
    this.logContainer.innerHTML = '';
    const reversedLog = [...this.battleLog].reverse();
    reversedLog.forEach(message => {
      const p = document.createElement('p');
      p.textContent = message;
      this.logContainer.appendChild(p);
    });
  }
}
