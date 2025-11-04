import { Scene } from '../scenes/Scene';
import { InputManager, Action } from '../input/InputManager';
import { UIManager } from '../ui/UIManager';
import { ConversationManager } from './ConversationManager';

export class SceneManager {
  private currentScene: Scene | null = null;
  private pausedScene: Scene | null = null;
  private pausedSceneName: string | null = null;
  private scenes: Map<string, Scene> = new Map();
  private lastTime: number = 0;
  public isPaused = false;
  private inputManager: InputManager;
  private uiManager: UIManager;
  public conversationManager: ConversationManager;
  private currentSceneName: string | null = null;

  constructor(inputManager: InputManager, uiManager: UIManager, conversationManager: ConversationManager) {
    this.inputManager = inputManager;
    this.uiManager = uiManager;
    this.conversationManager = conversationManager;
    this.gameLoop = this.gameLoop.bind(this);
  }

  addScene(name: string, scene: Scene): void {
    this.scenes.set(name, scene);
  }

  // For regular scene transitions (e.g., Title -> Field)
  changeScene(name: string, params?: unknown): void {
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
    this.currentSceneName = this.currentScene ? name : null;
    this.pausedScene = null; // Ensure no scene is marked as paused

    if (this.currentScene) {
      if (import.meta.env.DEV) {
        console.log(`Entering scene: ${this.currentScene.constructor.name}`);
      }
      const maybePromise = this.currentScene.enter(params);
      if (maybePromise instanceof Promise) {
        maybePromise.catch(error => console.error('Scene enter failed', error));
      }
    }
  }

  // For opening an overlay (e.g., Menu)
  openOverlay(name: string, params?: unknown): void {
    if (this.isPaused || !this.currentScene) return;

    this.isPaused = true;
    this.pausedScene = this.currentScene;
    this.pausedSceneName = this.currentSceneName;
    if (this.pausedScene.pause) {
      this.pausedScene.pause();
    }

    this.currentScene = this.scenes.get(name) || null;
    this.currentSceneName = this.currentScene ? name : this.currentSceneName;
    if (this.currentScene) {
       if (import.meta.env.DEV) {
        console.log(`Opening overlay: ${this.currentScene.constructor.name}`);
      }
      const maybePromise = this.currentScene.enter(params);
      if (maybePromise instanceof Promise) {
        maybePromise.catch(error => console.error('Overlay enter failed', error));
      }
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
    this.currentSceneName = this.pausedSceneName;
    this.pausedScene = null;
    this.pausedSceneName = null;
    this.isPaused = false;

    if (this.currentScene && this.currentScene.resume) {
      this.currentScene.resume();
    }
  }


  start(initialSceneName: string, params?: unknown): void {
    this.changeScene(initialSceneName, params);
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  getCurrentSceneName(): string | null {
    return this.currentSceneName;
  }

  destroy(): void {
    // Clean up any listeners if necessary
  }

  private gameLoop(currentTime: number): void {
    this.inputManager.update(); // Update input state first

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (this.inputManager.isActionJustPressed(Action.Menu)) {
      this.handleMenuToggle();
    }

    if (this.currentScene) {
      this.currentScene.update(deltaTime);
      this.currentScene.render();
    }

    requestAnimationFrame(this.gameLoop);
  }

  private handleMenuToggle(): void {
    const canOpenMenu = this.currentScene?.constructor.name === 'FieldScene' || this.currentScene?.constructor.name === 'BattleScene';
    if (this.isPaused) {
      this.closeOverlay();
    } else if (canOpenMenu) {
      this.openOverlay('menu');
    }
  }
}
