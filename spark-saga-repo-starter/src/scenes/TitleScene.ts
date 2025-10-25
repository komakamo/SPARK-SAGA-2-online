import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';

export class TitleScene implements Scene {
  private element: HTMLElement;
  private newGameButton: HTMLElement;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.element = document.getElementById('title-scene')!;
    this.newGameButton = document.getElementById('new-game-button')!;
    this.sceneManager = sceneManager;

    this.onNewGame = this.onNewGame.bind(this);
  }

  enter(): void {
    this.element.hidden = false;
    this.newGameButton.addEventListener('click', this.onNewGame);
  }

  exit(): void {
    this.element.hidden = true;
    this.newGameButton.removeEventListener('click', this.onNewGame);
  }

  update(deltaTime: number): void {
    // Title scene logic
  }

  render(): void {
    // Title scene rendering
  }

  private onNewGame(): void {
    this.sceneManager.changeScene('field');
  }
}
