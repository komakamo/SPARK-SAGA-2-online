import { Scene } from './Scene';
import { SceneManager } from '../managers/SceneManager';

export class ResultScene implements Scene {
  private element: HTMLElement;
  private backToFieldButton: HTMLElement;
  private sceneManager: SceneManager;

  constructor(sceneManager: SceneManager) {
    this.element = document.getElementById('result-scene')!;
    this.backToFieldButton = document.getElementById('back-to-field-button')!;
    this.sceneManager = sceneManager;

    this.onBackToField = this.onBackToField.bind(this);
  }

  enter(): void {
    this.element.hidden = false;
    this.backToFieldButton.addEventListener('click', this.onBackToField);
  }

  exit(): void {
    this.element.hidden = true;
    this.backToFieldButton.removeEventListener('click', this.onBackToField);
  }

  update(deltaTime: number): void {
    // Result scene logic
  }

  render(): void {
    // Result scene rendering
  }

  private onBackToField(): void {
    this.sceneManager.changeScene('field');
  }
}
