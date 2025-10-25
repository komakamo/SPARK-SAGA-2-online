import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';

export class FieldScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('field-scene')!;
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
      this.sceneManager.changeScene('battle');
    }
  }

  render(): void {
    // Field scene rendering
  }

  pause(): void {
    if (import.meta.env.DEV) {
      console.log('FieldScene paused');
    }
  }

  resume(): void {
    if (import.meta.env.DEV) {
      console.log('FieldScene resumed');
    }
  }

  private onEncounter(): void {
    this.sceneManager.changeScene('battle');
  }
}
