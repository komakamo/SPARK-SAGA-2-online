import { Scene } from '../scenes/Scene';

export class SceneManager {
  private currentScene: Scene | null = null;
  private pausedScene: Scene | null = null; // To store the scene when an overlay is active
  private scenes: Map<string, Scene> = new Map();
  private lastTime: number = 0;
  public isPaused = false; // Public flag to let scenes know the state

  constructor() {
    this.gameLoop = this.gameLoop.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  addScene(name: string, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  // For regular scene transitions (e.g., Title -> Field)
  changeScene(name: string): void {
    if (this.isPaused) {
      console.warn("Cannot change scene while an overlay is active.");
      return;
    }

    if (this.currentScene) {
      if (import.meta.env.DEV) {
        console.log(`Exiting scene: ${this.currentScene.constructor.name}`);
      }
      this.currentScene.exit();
    }

    this.currentScene = this.scenes.get(name) || null;
    this.pausedScene = null; // Ensure no scene is marked as paused

    if (this.currentScene) {
      if (import.meta.env.DEV) {
        console.log(`Entering scene: ${this.currentScene.constructor.name}`);
      }
      this.currentScene.enter();
    }
  }

  // For opening an overlay (e.g., Menu)
  openOverlay(name: string): void {
    if (this.isPaused || !this.currentScene) return;

    this.isPaused = true;
    this.pausedScene = this.currentScene;
    if (this.pausedScene.pause) {
      this.pausedScene.pause();
    }

    this.currentScene = this.scenes.get(name) || null;
    if (this.currentScene) {
       if (import.meta.env.DEV) {
        console.log(`Opening overlay: ${this.currentScene.constructor.name}`);
      }
      this.currentScene.enter();
    }
  }

  // For closing the current overlay
  closeOverlay(): void {
    if (!this.isPaused || !this.pausedScene) return;

    if (this.currentScene) {
      if (import.meta.env.DEV) {
        console.log(`Closing overlay: ${this.currentScene.constructor.name}`);
      }
      this.currentScene.exit();
    }

    this.currentScene = this.pausedScene;
    this.pausedScene = null;
    this.isPaused = false;

    if (this.currentScene && this.currentScene.resume) {
      this.currentScene.resume();
    }
  }


  start(initialSceneName: string): void {
    this.changeScene(initialSceneName);
    window.addEventListener('keyup', this.handleKeyUp);
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  destroy(): void {
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      // Can only open menu from Field or Battle
      const canOpenMenu = this.currentScene?.constructor.name === 'FieldScene' || this.currentScene?.constructor.name === 'BattleScene';

      if (this.isPaused) {
        this.closeOverlay();
      } else if (canOpenMenu) {
        this.openOverlay('menu');
      }
    }
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.currentScene) {
      // Only update the current scene (which could be an overlay)
      this.currentScene.update(deltaTime);
      // The paused scene is not updated, effectively pausing it
      this.currentScene.render();
    }

    requestAnimationFrame(this.gameLoop);
  }
}
