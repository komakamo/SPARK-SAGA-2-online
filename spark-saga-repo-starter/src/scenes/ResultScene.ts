import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';

export class ResultScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('result-scene')!;
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
      this.sceneManager.changeScene('field');
    }
  }

  render(): void {
    // Result scene rendering
  }

  private onBackToField(): void {
    this.sceneManager.changeScene('field');
  }
}
