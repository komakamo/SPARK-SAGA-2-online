import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';

export class MenuScene implements Scene {
  private element: HTMLElement;
  private closeMenuButton: HTMLElement;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.element = document.getElementById('menu-scene')!;
    this.closeMenuButton = document.getElementById('close-menu-button')!;
    this.sceneManager = sceneManager;

    this.onCloseMenu = this.onCloseMenu.bind(this);
  }

  enter(): void {
    this.element.hidden = false;
    this.closeMenuButton.addEventListener('click', this.onCloseMenu);
  }

  exit(): void {
    this.element.hidden = true;
    this.closeMenuButton.removeEventListener('click', this.onCloseMenu);
  }

  update(deltaTime: number): void {
    // Menu scene logic
  }

  render(): void {
    // Menu scene rendering
  }

  private onCloseMenu(): void {
    this.sceneManager.closeOverlay();
  }
}
