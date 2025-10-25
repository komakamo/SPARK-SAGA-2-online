import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';

export class BattleScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('battle-scene')!;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.uiManager = uiManager;
  }

  enter(): void {
    this.element.hidden = false;
    this.uiManager.updateHelpDisplay();
  }

  exit(): void {
    this.element.hidden = true;
  }

  update(deltaTime: number): void {
    if (this.inputManager.isActionJustPressed(Action.Confirm)) {
      this.sceneManager.changeScene('result'); // Victory
    }
    if (this.inputManager.isActionJustPressed(Action.Cancel)) {
      this.sceneManager.changeScene('field'); // Escape
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
}
