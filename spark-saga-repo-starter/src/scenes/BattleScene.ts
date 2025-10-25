import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';

export class BattleScene implements Scene {
  private element: HTMLElement;
  private victoryButton: HTMLElement;
  private escapeButton: HTMLElement;
  private gameoverButton: HTMLElement;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.element = document.getElementById('battle-scene')!;
    this.victoryButton = document.getElementById('victory-button')!;
    this.escapeButton = document.getElementById('escape-button')!;
    this.gameoverButton = document.getElementById('gameover-button')!;
    this.sceneManager = sceneManager;

    this.onVictory = this.onVictory.bind(this);
    this.onEscape = this.onEscape.bind(this);
    this.onGameOver = this.onGameOver.bind(this);
  }

  enter(): void {
    this.element.hidden = false;
    this.victoryButton.addEventListener('click', this.onVictory);
    this.escapeButton.addEventListener('click', this.onEscape);
    this.gameoverButton.addEventListener('click', this.onGameOver);
  }

  exit(): void {
    this.element.hidden = true;
    this.victoryButton.removeEventListener('click', this.onVictory);
    this.escapeButton.removeEventListener('click', this.onEscape);
    this.gameoverButton.removeEventListener('click', this.onGameOver);
  }

  update(deltaTime: number): void {
    // Battle scene logic
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
}
