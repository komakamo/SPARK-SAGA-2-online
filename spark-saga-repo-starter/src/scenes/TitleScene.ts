import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';

export class TitleScene implements Scene {
  private element: HTMLElement;
  private sceneManager: SceneManager;
  public inputManager: InputManager;
  public uiManager: UIManager;
  private newGameButton: HTMLElement;

  constructor(
    sceneManager: SceneManager,
    inputManager: InputManager,
    uiManager: UIManager,
  ) {
    this.element = document.getElementById('title-scene')!;
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.uiManager = uiManager;
    this.newGameButton = document.getElementById('new-game-button')!;
    this.newGameButton.addEventListener('click', () => this.sceneManager.changeScene('field'));
  }

  enter(): void {
    this.element.hidden = false;
    this.uiManager.updateHelpDisplay();
    this.element.style.display = 'block';
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
    // Title scene rendering
  }
}
