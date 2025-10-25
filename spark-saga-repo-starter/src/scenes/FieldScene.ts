import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';

export class FieldScene implements Scene {
  private element: HTMLElement;
  private encounterButton: HTMLElement;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.element = document.getElementById('field-scene')!;
    this.encounterButton = document.getElementById('encounter-button')!;
    this.sceneManager = sceneManager;

    this.onEncounter = this.onEncounter.bind(this);
  }

  enter(): void {
    this.element.hidden = false;
    this.encounterButton.addEventListener('click', this.onEncounter);
  }

  exit(): void {
    this.element.hidden = true;
    this.encounterButton.removeEventListener('click', this.onEncounter);
  }

  update(deltaTime: number): void {
    // Field scene logic
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
