import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';
import { Combatant } from '../combat/Combatant';

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
    this.player = new Combatant(100, 10);
    this.enemy = new Combatant(80, 8);
    this.turnOrder = [];
  }

  enter(): void {
    this.element.hidden = false;
    this.uiManager.updateHelpDisplay();
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
    const damage = Math.floor(Math.random() * 5 + 5); // Placeholder damage
    target.takeDamage(damage);
    this.log(`${attacker === this.player ? 'Player' : 'Enemy'} attacks ${target === this.player ? 'Player' : 'Enemy'} for ${damage} damage.`);
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
    if (currentCombatant === this.player) {
      this.isPlayerTurn = true;
      this.log('Your turn.');
    } else {
      this.isPlayerTurn = false;
      this.log('Enemy\'s turn.');
      // Simple AI: attack the player
      setTimeout(() => this.attack(this.enemy, this.player), 1000);
    }

    this.currentTurn = (this.currentTurn + 1) % this.turnOrder.length;
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
