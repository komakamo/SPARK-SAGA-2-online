import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';

export class MenuScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('menu-scene')!;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.uiManager = uiManager;
  }

  enter(): void {
    this.element.hidden = false;
  }

  exit(): void {
    this.element.hidden = true;
  }

  update(deltaTime: number): void {
    if (this.inputManager.isActionJustPressed(Action.Cancel)) {
      this.sceneManager.closeOverlay();
    }
  }

  render(): void {
    // Menu scene rendering
  }

  private onCloseMenu(): void {
    this.sceneManager.closeOverlay();
  }
}
